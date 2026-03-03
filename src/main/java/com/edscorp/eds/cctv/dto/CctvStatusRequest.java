package com.edscorp.eds.cctv.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CctvStatusRequest {
    private String locationCode;
    private String cctvCode;
    private int statusCam;
}
