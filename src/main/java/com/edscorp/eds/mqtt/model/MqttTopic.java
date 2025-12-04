package com.edscorp.eds.mqtt.model;

import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MqttTopic {
    REQ("cctv/req", ReqDTO.class),
    SETBOUNDARY("cctv/setBoundary", SetBoundaryDTO.class),
    RESETIP("cctv/resetIP", ResetIpDTO.class),
    POWERSTATUS("send/powerStatus", PowerStatusDTO.class),
    EMERGENCY("send/emergency", EmergencyDTO.class),
    BOUNDARYINFO("send/boundaryInfo", BoundaryInfoDTO.class);

    private final String topicName;
    private final Class<?> messageClass;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static MqttTopic fromString(String topicName) {
        for (MqttTopic mqttTopic : MqttTopic.values()) {
            if (mqttTopic.getTopicName().equals(topicName)) {
                return mqttTopic;
            }
        }
        throw new IllegalArgumentException("Unknown topic: " + topicName);
    }

    public Object parseMessage(String jsonMessage) throws IOException {
        return objectMapper.readValue(jsonMessage, messageClass);
    }
}
