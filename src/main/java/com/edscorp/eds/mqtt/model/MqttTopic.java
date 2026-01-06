package com.edscorp.eds.mqtt.model;

import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * MQTT Topic
 * preset_num : 1 ~ 4
 * boundary_num : 1 ~ 4
 * alertCode 001: CCTV 연결, 002: CCTV 연결 끊김
 * boundary_type
 * 1: 사각형(RECT), 2: 타원형(ELLIPSE), 3: 직선(LINE), 4: 곡선(POLY), 5: 영역(AREA).
 */
@Getter
@RequiredArgsConstructor
public enum MqttTopic {
    // 모둘에 대한 정보 요청
    // reqCode 1: 시스템 동작 확인, 2: 현재 바운더리 정보
    REQ("cctv/req", ReqDTO.class),

    // 모듈의 바운더리 정보 원격 설정
    SETBOUNDARY("cctv/setBoundary", SetBoundaryDTO.class),

    // 카메라의 IP(URL)를 재설정
    RESETIP("cctv/resetIP", ResetIpDTO.class),

    // 시스템의 상태 전송
    // status_cam True(1): 카메라 동작, False(0): 카메라 에러 = 카메라 IP 재설정 필요
    // status_proc True(1): 딥러닝 동작, False(0): 프로세싱 에러
    POWERSTATUS("send/powerStatus", PowerStatusDTO.class),

    // 영역 출입, 해제 정보 전송
    EMERGENCY("send/emergency", EmergencyDTO.class),
    // 모듈의 바운더리 정보 원격 설정
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
