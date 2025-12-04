package com.edscorp.eds.rainfall.vo.global;

import lombok.Data;

@Data
public class RAINFORECASTLISTVO {
    private String forecastReg;
    private String forecastDate;
    private String forecastTime;
    private String SKY;
    private String PTY;
    private String TMP;
    private String SKYNUM;
    private String PTYNUM;
    private String toDay;

}