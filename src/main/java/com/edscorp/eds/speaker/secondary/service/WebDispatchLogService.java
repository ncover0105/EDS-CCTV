package com.edscorp.eds.speaker.secondary.service;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.secondary.domain.TbWebSpkDispatchLog;
import com.edscorp.eds.speaker.secondary.dto.WebDispatchLogRequest;
import com.edscorp.eds.speaker.secondary.dto.WebSpkDispatchLogRow;
import com.edscorp.eds.speaker.secondary.repository.TbWebSpkDispatchLogRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class WebDispatchLogService {

    private final TbWebSpkDispatchLogRepository repo;

    @Transactional
    public Long writeLog(WebDispatchLogRequest req, String userId, String ip, String ua) {
        String speakerId = req.getSpeakerId();
        String speakerIdsJson = toSpeakerIdsJson(req);

        // speakerIds가 1개이고 speakerId가 비어있으면 단일 speakerId로도 넣어줌
        if ((speakerId == null || speakerId.isBlank())
                && req.getSpeakerIds() != null
                && req.getSpeakerIds().size() == 1) {
            speakerId = req.getSpeakerIds().get(0);
        }

        LocalDateTime eventTime = (req.getDispatchTime() != null)
                ? req.getDispatchTime()
                : LocalDateTime.now();

        TbWebSpkDispatchLog saved = repo.save(
                TbWebSpkDispatchLog.builder()
                        .dispatchTime(eventTime) // 이벤트 발생 시각
                        .dispatchType(nvl(req.getDispatchType(), "MANUAL"))
                        .mode(req.getMode()) // REAL/TEST
                        .alertType(req.getAlertType()) // ALERT/TEST 등(선택)
                        .broadcastType(req.getBroadcastType()) // TTS/BGM/SIREN
                        .priority(req.getPriority()) // NONE/CAUTION/WARNING/DANGER
                        .scope(req.getScope()) // ALL/PART
                        .disasterCode(req.getDisasterCode()) // SR1 등
                        .ttsMessage(req.getTts()) // TTS 전문
                        .commandCode(req.getCommandCode()) // ex) 41
                        .speakerId(speakerId)
                        .speakerIds(speakerIdsJson)
                        .requestUserId(userId)
                        .requestIp(ip)
                        .requestUa(ua)
                        .memo(req.getMemo())
                        .dispatchTime(req.getDispatchTime()) // null이면 @PrePersist로 현재시간 들어감
                        .build());

        return saved.getLogKey();
    }

    @Transactional(readOnly = true)
    public Page<WebSpkDispatchLogRow> search(
            LocalDateTime start,
            LocalDateTime end,
            String mode,
            String priority,
            String speakerQ,
            String messageQ,
            int page,
            int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dispatchTime"));

        // ✅ 조인 DTO 조회 메서드 사용
        Page<WebSpkDispatchLogRow> raw = repo.searchWithDisaster(start, end, mode, priority, speakerQ, messageQ, pr);

        // ✅ 운영용: 메시지 최종값을 확정해서 내려줌
        return raw.map(r -> {
            // 1) 메시지 확정 (TTS -> 기본메시지 -> 메모)
            String finalMsg = pickMessage(r.getTtsMessage(), r.getDefaultMessage(), r.getMemo());
            r.setTtsMessage(finalMsg);

            // 2) priority가 비어있으면 재난 우선순위로 fallback (문자열로 내려줌)
            if (isBlank(r.getPriority()) && r.getDisasterPriority() != null) {
                r.setPriority(String.valueOf(r.getDisasterPriority()));
            }

            // 3) 기타 기본값 정리(선택)
            if (isBlank(r.getBroadcastType()))
                r.setBroadcastType("ETC");
            if (isBlank(r.getDispatchType()))
                r.setDispatchType("MANUAL");

            return r;
        });
    }

    // =========================
    // 내부 유틸
    // =========================

    private String toSpeakerIdsJson(WebDispatchLogRequest req) {
        if (req.getSpeakerIds() == null || req.getSpeakerIds().isEmpty())
            return null;

        // JSON 라이브러리 없이 최소한으로 JSON 배열 형태 문자열 생성
        // ex) ["SPK-001","SPK-002"]
        return req.getSpeakerIds().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.replace("\"", "")) // 안전하게 " 제거
                .map(s -> "\"" + s + "\"")
                .reduce((a, b) -> a + "," + b)
                .map(s -> "[" + s + "]")
                .orElse("[]");
    }

    private String pickMessage(String tts, String defMsg, String memo) {
        if (!isBlank(tts))
            return tts;
        if (!isBlank(defMsg))
            return defMsg;
        if (!isBlank(memo))
            return memo;
        return "";
    }

    private String nvl(String v, String fb) {
        return isBlank(v) ? fb : v;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
