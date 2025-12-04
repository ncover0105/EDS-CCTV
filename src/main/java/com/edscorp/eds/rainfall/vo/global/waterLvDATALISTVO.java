package com.edscorp.eds.rainfall.vo.global;

import lombok.Data;

@Data
public class waterLvDATALISTVO {
    private String UID;
    private String name;
    private String colway;
    private String EventTime;
    private String waterLv;
    private String waterLv15Gap;
    private String waterLv60Gap;
    private String waterLvTdayGap;
    private String waterLvYdayGap;
    private String waterLvYdayMax;
    private String waterLvTdayMax;

}