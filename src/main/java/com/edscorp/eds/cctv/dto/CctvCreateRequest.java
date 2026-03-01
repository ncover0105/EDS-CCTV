package com.edscorp.eds.cctv.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CctvCreateRequest {
    private String cctvCode;
    private String name;
    private String rtspUrl;
    private String lowRtspUrl;
    private String highRtspUrl;
    private String latitude;
    private String longitude;
    private String id;
    private String password;

    private String locationCode;
    private Integer mountpointId;
    private Integer videoPort;
    private String address;
    private String type;
    private String wsPort;
    private String statusCam;

    // RTSP 품질별 설정
    private Integer lowMountpointId;
    private Integer highMountpointId;
    private Integer lowVideoPort;
    private Integer highVideoPort;
}