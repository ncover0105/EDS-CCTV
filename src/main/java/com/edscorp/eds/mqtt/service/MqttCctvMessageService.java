package com.edscorp.eds.mqtt.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.common.util.Util;
import com.edscorp.eds.mqtt.dto.MqttMessageEvent;
import com.edscorp.eds.mqtt.model.MqttTopic;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttCctvMessageService {
    private static final int MIN_BOUNDARY_NUM = 1;
    private static final int MAX_BOUNDARY_NUM = 4;

    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final MqttService mqttService;

    @Transactional
    public void handle(String topic, String payload) {
        MqttTopic mqttTopic = MqttTopic.fromString(topic);

        if (mqttTopic == MqttTopic.EMERGENCY) {
            handleEmergency(topic, payload);
            return;
        }

        eventPublisher.publishEvent(new MqttMessageEvent(topic, payload));
    }

    private void handleEmergency(String topic, String payload) {
        try {
            JsonNode jsonMessage = objectMapper.readTree(payload);
            String alertCode = requiredText(jsonMessage, "alertCode");
            int boundaryNum = requiredInt(jsonMessage, "boundaryNum");

            if (!isValidBoundaryNum(boundaryNum)) {
                log.warn("Invalid emergency boundaryNum received. topic={}, boundaryNum={}, payload={}",
                        topic, boundaryNum, payload);
                return;
            }

            String receptionDttm = requiredText(jsonMessage, "receptionDttm");
            String formatDttm = Util.parseReceptionDttm(receptionDttm);
            String logData = buildEmergencyLog(alertCode, boundaryNum);

            ObjectNode updatedMessage = (ObjectNode) jsonMessage;
            updatedMessage.put("log", logData);
            updatedMessage.put("receptionDttm", formatDttm);

            String updatedPayload = updatedMessage.toString();
            mqttService.processMessage(topic, updatedPayload);
            publishAfterCommit(topic, updatedPayload);
        } catch (Exception e) {
            log.error("MQTT emergency message handling failed. topic={}, payload={}", topic, payload, e);
            throw new IllegalStateException("MQTT emergency message handling failed", e);
        }
    }

    private String buildEmergencyLog(String alertCode, int boundaryNum) {
        if ("001".equals(alertCode) || "002".equals(alertCode)) {
            return mqttService.getMessageBtAlertCode(alertCode);
        }
        return boundaryNum + "번 " + mqttService.getMessageBtAlertCode(alertCode);
    }

    private void publishAfterCommit(String topic, String payload) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            eventPublisher.publishEvent(new MqttMessageEvent(topic, payload));
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                eventPublisher.publishEvent(new MqttMessageEvent(topic, payload));
            }
        });
    }

    private boolean isValidBoundaryNum(int boundaryNum) {
        return boundaryNum >= MIN_BOUNDARY_NUM && boundaryNum <= MAX_BOUNDARY_NUM;
    }

    private String requiredText(JsonNode jsonMessage, String fieldName) {
        JsonNode value = jsonMessage.get(fieldName);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new IllegalArgumentException("Missing MQTT field: " + fieldName);
        }
        return value.asText();
    }

    private int requiredInt(JsonNode jsonMessage, String fieldName) {
        JsonNode value = jsonMessage.get(fieldName);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new IllegalArgumentException("Invalid MQTT integer field: " + fieldName);
        }
        try {
            return Integer.parseInt(value.asText());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid MQTT integer field: " + fieldName, e);
        }
    }
}
