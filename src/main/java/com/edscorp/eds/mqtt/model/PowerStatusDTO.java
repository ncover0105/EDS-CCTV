package com.edscorp.eds.mqtt.model;

import lombok.Data;

@Data
public class PowerStatusDTO {
    private String locationCode;
    private String cctvCode;
    private String alertCode;
    private String status_cam;
    private String status_proc;
    private String rstp_ip;
    private String receptionDttm;
}
