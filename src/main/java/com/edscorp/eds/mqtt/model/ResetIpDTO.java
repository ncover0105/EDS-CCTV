package com.edscorp.eds.mqtt.model;

import lombok.Data;

@Data
public class ResetIpDTO {
    private String locationCode;
    private String cctvCode;
    private String camera_ip;
    private String camera_id;
    private String camera_pw;
}
