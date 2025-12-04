package com.edscorp.eds.mqtt.model;

import lombok.Data;

@Data
public class ReqDTO {
    private String locationCode;
    private String cctvCode;
    private String reqCode;
    private String preset_num;
}