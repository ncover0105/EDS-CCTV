package com.edscorp.eds.speaker.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.edscorp.eds.speaker.domain.DisasterListEntity;
import com.edscorp.eds.speaker.dto.BTypeActionRequest;
import com.edscorp.eds.speaker.dto.BTypeAlertRequest;
import com.edscorp.eds.speaker.repository.DisasterListRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BTypeCommandService {

    private final RestTemplate restTemplate;
    private final DisasterListRepository disasterListRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 데몬 서버 playradio 주소 (application.properties 에서 설정 가능)
    private static final String PLAYRADIO_URL = "http://localhost:3000/playradio";

    /**
     * 데몬 서버로 실제 명령 전송
     */
    private void sendToPlayRadio(String deviceId, String clientIp,
            String commandCode, String argument) {

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", deviceId);
        payload.put("ip", clientIp);
        payload.put("commandCode", commandCode);
        payload.put("argument", argument);

        log.info("[B-Type SEND] id={}, ip={}, commandCode={}, argument={}",
                deviceId, clientIp, commandCode, argument);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(PLAYRADIO_URL, entity, String.class);

        log.info("[B-Type RESP] status={}, body={}",
                response.getStatusCode(), response.getBody());
    }

    // =========================
    // 발령 (JS sendAlert 포팅)
    // =========================
    public void sendAlert(BTypeAlertRequest req, HttpServletRequest httpReq) throws Exception {

        // 필수 값 체크
        if (req.getAlertMode() == null ||
                req.getDisasterCode() == null ||
                req.getAlertKind() == null ||
                req.getAlertRange() == null ||
                req.getAlertPriority() == null ||
                req.getTtsMessage() == null) {
            throw new IllegalArgumentException("필수 발령 필드가 누락되었습니다.");
        }

        int alertPriority = req.getAlertPriority();
        String alertStoCd = "000";
        String alertSirenCd = "000";
        String alertTTSmessage = req.getTtsMessage();
        int alertKind = req.getAlertKind();

        if (alertKind == 1) {
            // TTS만 사용하는 경우 (그대로 사용)
        } else if (alertKind == 2 || alertKind == 3) {
            // 재난 코드 기반 방송
            DisasterListEntity disaster = disasterListRepository
                    .findByDstCd(req.getDisasterCode())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid disasterCode: " + req.getDisasterCode()));

            if (disaster.getDstPriority() != null) {
                alertPriority = disaster.getDstPriority();
            } else {
                throw new IllegalArgumentException(
                        "dst_priority not found for disasterCode: " + req.getDisasterCode());
            }

            if (disaster.getDstSirenCode() != null && disaster.getDstStoCd() != null) {
                String dstSirenCode = disaster.getDstSirenCode();
                String dstStoCd = disaster.getDstStoCd();
                String dstStoMsg = disaster.getDstStoMsg();

                if ("000".equals(dstStoCd)) {
                    alertTTSmessage = (dstStoMsg != null ? dstStoMsg : "");
                    alertKind = 1;
                } else {
                    alertTTSmessage = dstSirenCode + dstStoCd + dstSirenCode;
                }

                alertStoCd = dstStoCd;
                alertSirenCd = dstSirenCode;
            } else {
                throw new IllegalArgumentException(
                        "Incomplete disasterData fields for disasterCode: " + req.getDisasterCode());
            }
        } else {
            throw new IllegalArgumentException("Unsupported alertKind: " + alertKind);
        }

        // argument JSON 생성 (JS 구조 그대로)
        Map<String, Object> argumentJson = new HashMap<>();
        argumentJson.put("alertMode", req.getAlertMode());
        argumentJson.put("resultMedia", 1);
        argumentJson.put("disasterCode", req.getDisasterCode());
        argumentJson.put("alertKind", alertKind);
        argumentJson.put("alertRange", req.getAlertRange());
        argumentJson.put("alertPriority", alertPriority);
        argumentJson.put("ttsMessage", alertTTSmessage);
        argumentJson.put("alertStoCd", alertStoCd);
        argumentJson.put("alertSirenCd", alertSirenCd);

        String argumentStr = objectMapper.writeValueAsString(argumentJson);

        String clientIp = httpReq.getRemoteAddr();
        sendToPlayRadio(req.getDeviceId(), clientIp, req.getCommandCode(), argumentStr);
    }

    // =========================
    // 스피커 제어 (JS handleSpeakerAction 포팅)
    // =========================
    public void handleSpeakerAction(BTypeActionRequest req, HttpServletRequest httpReq) {

        List<String> speakerIds = req.getSpeakerIds();
        if (speakerIds == null || speakerIds.isEmpty()) {
            throw new IllegalArgumentException("선택된 스피커가 없습니다.");
        }

        String action = req.getAction();
        String extraParam = req.getExtraParam() == null ? "" : req.getExtraParam();

        String commandCode;
        String argument;

        // 각 버튼의 action에 맞는 commandCode와 argument 설정
        switch (action) {
            case "time": // 시간 설정
                commandCode = "4f";
                argument = "00000000";
                break;
            case "status": // 상태 요청
                commandCode = "43";
                argument = "";
                break;
            case "reset": // 스피커 리셋
                commandCode = "4d";
                argument = "01";
                break;
            case "getSpeakerSettings": // 스피커 설정값 요청 전체
                commandCode = "45";
                argument = "00";
                break;
            case "getVolume": // 스피커 볼륨값 요청
                commandCode = "45";
                argument = "01";
                break;
            case "getSpeakerUsage": // 스피커 사용 설정 요청
                commandCode = "45";
                argument = "02";
                break;
            case "getSpeakerIP": // 스피커 IP 설정 요청
                commandCode = "45";
                argument = "04";
                break;
            case "getSpeakerID": // 스피커 ID 설정 요청
                commandCode = "45";
                argument = "05";
                break;
            case "getBGMFolder": // BGM 폴더 설정 요청
                commandCode = "45";
                argument = "06";
                break;
            case "getBGMStatus": // BGM 상태 요청
                commandCode = "45";
                argument = "07";
                break;
            case "getInputVolume": // 입력 볼륨 요청
                commandCode = "45";
                argument = "08";
                break;
            case "getTTSSpeed": // TTS 속도 및 스피치 요청
                commandCode = "45";
                argument = "09";
                break;
            case "getPollingTime": // 폴링 시간 요청
                commandCode = "45";
                argument = "0a";
                break;
            case "getAudioMode": // 음원 모드 설정 요청
                commandCode = "45";
                argument = "0b";
                break;
            case "getFMSettings": // FM 설정 요청
                commandCode = "45";
                argument = "0c";
                break;
            case "insSpeakerSettings": // 스피커 설정값 요청 전체
                commandCode = "46";
                argument = "00";
                break;
            case "insBgmVolume": // 스피커 볼륨값 요청
                commandCode = "46";
                argument = "0100" + extraParam;
                break;
            case "insAlertVolume": // 스피커 볼륨값 요청
                commandCode = "46";
                argument = "0101" + extraParam;
                break;
            case "ins_channels": // 스피커 사용 설정 요청
                commandCode = "46";
                argument = "02" + extraParam;
                break;
            case "ins_ServerIP": // 스피커 IP 설정 요청
                commandCode = "46";
                argument = "04" + extraParam;
                break;
            case "ins_speakerid": // 스피커 ID 설정 요청
                commandCode = "46";
                argument = "05" + extraParam;
                break;
            case "ins_BGMFolderNo": // BGM 폴더 설정 요청
                commandCode = "46";
                argument = "06" + extraParam;
                break;
            case "insBGMStatus": // BGM 상태 입력
                commandCode = "46";
                argument = "07" + extraParam;
                break;
            case "ins_BGM_IN_VOL": // 입력 볼륨 요청
                commandCode = "46";
                argument = "0800" + extraParam;
                break;
            case "ins_STO_IN_VOL": // 입력 볼륨 요청
                commandCode = "46";
                argument = "0801" + extraParam;
                break;
            case "ins_TTS_IN_VOL": // 입력 볼륨 요청
                commandCode = "46";
                argument = "0802" + extraParam;
                break;
            case "ins_TTS_Pitch": // TTS 속도 및 스피치 요청
                commandCode = "46";
                argument = "0900" + extraParam;
                break;
            case "ins_TTS_Speed": // TTS 속도 및 스피치 요청
                commandCode = "46";
                argument = "0901" + extraParam;
                break;
            case "ins_PollingCheckTime": // 폴링 시간 요청
                commandCode = "46";
                argument = "0a" + extraParam;
                break;
            case "insAudioMode": // 음원 모드 설정 요청
                commandCode = "46";
                argument = "0b" + extraParam;
                break;
            case "insFMSettings": // FM 설정 요청
                commandCode = "46";
                argument = "0c" + extraParam;
                break;
            default:
                throw new IllegalArgumentException("지원되지 않는 작업입니다: " + action); // 잘못된 action 처리
        }

        String clientIp = httpReq.getRemoteAddr();

        // 선택된 각 스피커에 대해 데몬서버로 명령 전송
        for (String speakerId : speakerIds) {
            sendToPlayRadio(speakerId, clientIp, commandCode, argument);
        }
    }

}
