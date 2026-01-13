package com.edscorp.eds.mqtt.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyLogRowDTO {
    private Integer id;
    private String cctvCode;
    private String alertCode;
    private Integer boundaryNum;
    private String log;
    private String inpDttm;
}
