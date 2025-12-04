package com.edscorp.eds.mqtt.model;

import lombok.Data;

@Data
public class EmergencyDTO {
    private String locationCode;
    private String cctvCode;
    private String alertCode;
    private String boundaryType;
    private String boundaryNum;
    private String receptionDttm;
    private String log;
}
