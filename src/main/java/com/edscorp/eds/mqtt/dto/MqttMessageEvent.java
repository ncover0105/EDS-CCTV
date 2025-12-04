package com.edscorp.eds.mqtt.dto;

import lombok.Data;

@Data
public class MqttMessageEvent {
    private final String topic;
    private final String message;
}
