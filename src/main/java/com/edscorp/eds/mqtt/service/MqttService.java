package com.edscorp.eds.mqtt.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

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

    private final EmergencyRepository emergencyMessageRepository;

    private final AlertListRepository alertListRepository;
    private final Map<String, String> alertListCache = new HashMap<>();

    public void processMessage(String topic, String payload) {
        System.out.println("Mqtt processMessage ");

        try {
            MqttTopic mqttTopic = MqttTopic.fromString(topic);
            Object message = mqttTopic.parseMessage(payload);

            switch (mqttTopic) {
                case REQ:
                    System.out.println("Mqtt REQ ");

                    break;
                case SETBOUNDARY:
                    System.out.println("Mqtt SETBOUNDARY ");

                    break;
                case RESETIP:
                    System.out.println("Mqtt RESETIP ");

                    break;
                case POWERSTATUS:
                    System.out.println("Mqtt POWERSTATUS ");

                    break;

                case EMERGENCY:
                    System.out.println("Mqtt EMERGENCY ");
                    processEmergency((EmergencyDTO) message);
                    break;

                case BOUNDARYINFO:
                    System.out.println("Mqtt BOUNDARYINFO ");

                    break;
                default:
                    System.out.println("Mqtt default ");

                    break;
            }
        } catch (IllegalArgumentException e) {
            log.error("Unknown topic: {}", topic, e);
        } catch (IOException e) {
            e.printStackTrace();
            log.error("Mqtt Error parsing message for topic {}: {}", topic, payload, e);
        }
    }

    // JPA

    private void processREQ(ReqDTO message) {
        log.info("Mqtt processREQ : ", message);
    }

    private void processSetBoundary(SetBoundaryDTO message) {
        log.info("Mqtt processSetBoundary : ", message);

    }

    private void processResetIP(ResetIpDTO message) {
        log.info("Mqtt processResetIP : ", message);

    }

    private void processPowerStatus(PowerStatusDTO message) {
        log.info("Mqtt processPowerStatus : ", message);

    }

    @Transactional
    private void processEmergency(EmergencyDTO message) {
        log.info("Mqtt processEmergency : alertcode " + message.getAlertCode() + " bundarynum "
                + message.getBoundaryNum());
        // String logData = message.getBoundaryNum() + "번 구역 " +
        // getMessageBtAlertCode(message.getAlertCode().toString());
        Date inpDttm = Util.parseDttm(message.getReceptionDttm());

        boolean exists = emergencyMessageRepository.existsByCctvCodeAndAlertCodeAndBoundaryNumAndInpDttm(
                message.getCctvCode(), message.getAlertCode(), Integer.valueOf(message.getBoundaryNum()), inpDttm);

        if (exists) {
            log.info("MqttService processEmergency : Duplicate emergency log detected. Insert skipped.");
            return;
        }

        EmergencyEntity emergencyMessageEntity = EmergencyEntity.builder()
                .cctvCode(message.getCctvCode())
                .alertCode(message.getAlertCode())
                .boundaryNum(Integer.valueOf(message.getBoundaryNum()))
                .log(message.getLog())
                .inpDttm(inpDttm)
                .build();

        emergencyMessageRepository.save(emergencyMessageEntity);
        System.out.println("Mqtt JPA emergency Insert success>>>>>>>>>>>>>>>>>>>");
    }

    private void processBoundaryInfo(BoundaryInfoDTO message) {
        log.info("Mqtt processBoundaryInfo : ", message);
    }

    // Cache
    @PostConstruct
    public void loadAlertMessages() {
        try {
            // 데이터를 로드하고 캐시를 채우는 로직
            alertListRepository.findAll().forEach(alert -> {
                alertListCache.put(alert.getAlertCode(), alert.getMessage());
            });
            System.out.println("Alert messages loaded into cache: " + alertListCache.size());
        } catch (Exception e) {
            System.err.println("Error loading alert messages into cache: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // alertCode에 따른 message 조회
    public String getMessageBtAlertCode(String alertCode) {
        return alertListCache.getOrDefault(alertCode, "알 수 없는 경고");
    }

    // alertCode 전체 message 조회
    public Map<String, String> getAllAlertMessages() {
        return new HashMap<>(alertListCache);
    }
}
