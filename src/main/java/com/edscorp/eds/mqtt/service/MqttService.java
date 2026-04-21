package com.edscorp.eds.mqtt.service;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.mqtt.model.MqttTopic;
import com.edscorp.eds.common.util.Util;
import com.edscorp.eds.mqtt.domain.EmergencyEntity;
import com.edscorp.eds.mqtt.model.BoundaryInfoDTO;
import com.edscorp.eds.mqtt.model.EmergencyDTO;
import com.edscorp.eds.mqtt.model.PowerStatusDTO;
import com.edscorp.eds.mqtt.model.ReqDTO;
import com.edscorp.eds.mqtt.model.ResetIpDTO;
import com.edscorp.eds.mqtt.model.SetBoundaryDTO;
import com.edscorp.eds.mqtt.repository.AlertListRepository;
import com.edscorp.eds.mqtt.repository.EmergencyRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttService {
    private static final int MIN_BOUNDARY_NUM = 1;
    private static final int MAX_BOUNDARY_NUM = 4;

    private final EmergencyRepository emergencyMessageRepository;
    private final AlertListRepository alertListRepository;

    // [fix] HashMap → ConcurrentHashMap 교체.
    //       현재는 @PostConstruct 이후 읽기 전용이라 안전하지만,
    //       향후 캐시 갱신 로직 추가 시에도 동시성 문제가 발생하지 않도록 선제 적용.
    private final Map<String, String> alertListCache = new ConcurrentHashMap<>();

    public void processMessage(String topic, String payload) {
        log.debug("MQTT 메시지 수신 - topic: {}", topic);

        try {
            MqttTopic mqttTopic = MqttTopic.fromString(topic);
            Object message = mqttTopic.parseMessage(payload);

            // [fix] switch 각 case의 System.out.println → log.debug 교체.
            //       운영 환경에서 stdout으로 출력되는 디버그 로그는 로그 수집 시스템에서 누락됨.
            switch (mqttTopic) {
                case REQ:
                    log.debug("MQTT REQ 수신");
                    break;
                case SETBOUNDARY:
                    log.debug("MQTT SETBOUNDARY 수신");
                    break;
                case RESETIP:
                    log.debug("MQTT RESETIP 수신");
                    break;
                case POWERSTATUS:
                    log.debug("MQTT POWERSTATUS 수신");
                    break;
                case EMERGENCY:
                    log.debug("MQTT EMERGENCY 수신");
                    processEmergency((EmergencyDTO) message);
                    break;
                case BOUNDARYINFO:
                    log.debug("MQTT BOUNDARYINFO 수신");
                    break;
                default:
                    log.warn("MQTT 처리되지 않은 토픽 - topic: {}", topic);
                    break;
            }
        } catch (IllegalArgumentException e) {
            log.error("알 수 없는 MQTT 토픽 - topic: {}", topic, e);
        } catch (IOException e) {
            // [fix] e.printStackTrace() 제거 → log.error로 통합.
            //       printStackTrace()는 로그 수집 시스템을 우회하고 스택 트레이스 포맷이
            //       로그 파서와 충돌할 수 있음.
            log.error("MQTT 메시지 파싱 오류 - topic: {}, payload: {}", topic, payload, e);
        }
    }

    private void processREQ(ReqDTO message) {
        log.info("MQTT processREQ: {}", message);
    }

    private void processSetBoundary(SetBoundaryDTO message) {
        log.info("MQTT processSetBoundary: {}", message);
    }

    private void processResetIP(ResetIpDTO message) {
        log.info("MQTT processResetIP: {}", message);
    }

    private void processPowerStatus(PowerStatusDTO message) {
        log.info("MQTT processPowerStatus: {}", message);
    }

    // [fix] private → public 으로 접근 제한자 변경.
    //       Spring AOP 프록시는 private 메서드를 인터셉트하지 못해 @Transactional이
    //       실제로 적용되지 않았음. 중복 체크(existsBy...) + save() 사이에
    //       트랜잭션 보호가 없으면 동시 이벤트 수신 시 중복 저장이 발생할 수 있음.
    @Transactional
    public void processEmergency(EmergencyDTO message) {
        log.info("MQTT EMERGENCY 처리 - alertCode: {}, boundaryNum: {}",
                message.getAlertCode(), message.getBoundaryNum());

        Integer boundaryNum = parseBoundaryNum(message.getBoundaryNum());
        if (!isValidBoundaryNum(boundaryNum)) {
            log.warn("유효하지 않은 boundaryNum 무시 - alertCode: {}, boundaryNum: {}, cctvCode: {}, receptionDttm: {}",
                    message.getAlertCode(), message.getBoundaryNum(),
                    message.getCctvCode(), message.getReceptionDttm());
            return;
        }

        Date inpDttm = Util.parseDttm(message.getReceptionDttm());

        boolean exists = emergencyMessageRepository.existsByCctvCodeAndAlertCodeAndBoundaryNumAndInpDttm(
                message.getCctvCode(), message.getAlertCode(), boundaryNum, inpDttm);

        if (exists) {
            log.info("중복 출입 이벤트 감지 - 저장 건너뜀. cctvCode: {}", message.getCctvCode());
            return;
        }

        EmergencyEntity emergencyMessageEntity = EmergencyEntity.builder()
                .cctvCode(message.getCctvCode())
                .alertCode(message.getAlertCode())
                .boundaryNum(boundaryNum)
                .log(message.getLog())
                .inpDttm(inpDttm)
                .build();

        emergencyMessageRepository.save(emergencyMessageEntity);
        log.info("출입 이벤트 저장 완료 - cctvCode: {}, boundaryNum: {}", message.getCctvCode(), boundaryNum);
    }

    private void processBoundaryInfo(BoundaryInfoDTO message) {
        log.info("MQTT processBoundaryInfo: {}", message);
    }

    // [fix] System.out.println / System.err.println → log.info / log.error 교체.
    @PostConstruct
    public void loadAlertMessages() {
        try {
            alertListRepository.findAll().forEach(alert ->
                    alertListCache.put(alert.getAlertCode(), alert.getMessage()));
            log.info("AlertList 캐시 로드 완료 - {}건", alertListCache.size());
        } catch (Exception e) {
            log.error("AlertList 캐시 로드 실패", e);
        }
    }

    public String getMessageBtAlertCode(String alertCode) {
        return alertListCache.getOrDefault(alertCode, "알 수 없는 경고");
    }

    public Map<String, String> getAllAlertMessages() {
        return new HashMap<>(alertListCache);
    }

    private boolean isValidBoundaryNum(Integer boundaryNum) {
        return boundaryNum != null && boundaryNum >= MIN_BOUNDARY_NUM && boundaryNum <= MAX_BOUNDARY_NUM;
    }

    private Integer parseBoundaryNum(String boundaryNum) {
        try {
            return Integer.valueOf(boundaryNum);
        } catch (Exception e) {
            return null;
        }
    }
}
