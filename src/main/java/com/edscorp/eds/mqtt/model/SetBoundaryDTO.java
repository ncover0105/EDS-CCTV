package com.edscorp.eds.mqtt.model;

import lombok.Data;

@Data
public class SetBoundaryDTO {
    private String locationCode;
    private String cctvCode;
    private String preset_num;
    private String boundary_num;
    private String boundary_type;
    private String target_point_x;
    private String target_point_y;
    private String date;
}
