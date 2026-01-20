package com.edscorp.eds.cctv.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CctvUpdateRequest {
    // private String cctvCode;
    private String name;
    private Integer mountpointId;
    private Integer videoPort;
    private String address;
    private String id;
    private String password;
    private String rtspUrl;
    private String type;
    private String wsPort;
    private String latitude;
    private String longitude;
}
