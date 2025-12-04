package com.edscorp.eds.rainfall.vo.global;

import lombok.Data;

@Data
public class O2VO{
    private String dataTime;
    private String pm10Value;
    private String pm25Value;
    private String o3Value;
    private String pm10Grade;
    private String pm25Grade;
    private String o3Grade;
}