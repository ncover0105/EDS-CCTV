package com.edscorp.eds.rainfall.vo.base;

import com.edscorp.eds.common.util.Util;

import lombok.Data;

@Data
public class baseCarListVO {
    private String corpCd;
    private String corpNm;
    private String busiCd;
    private String busiNm;
    private String depaCd;
    private String depaNm;
    private String carCd;
    private String carNo;
    private String carNm;
    private String carDivi;
    private String oilType;
    private String fuelAmt;
    private String insuCorpDivi;
    private String insuExpiDt;
    private String sumCumuMile;
    private String cumuMile;
    private String buyDt;
    private String buyDivi;
    private String periInspExpiDt;
    private String note;
    private String inpId;
    private String inpNm;
    private String updId;
    private String updNm;

    public String getInsuExpiDt() {
        return Util.addMinusChar(insuExpiDt);
    }

    public String getBuyDt() {
        return Util.addMinusChar(buyDt);
    }

    public String getPeriInspExpiDt() {
        return Util.addMinusChar(periInspExpiDt);
    }

    public String getFuelAmt() {
        return Util.addCommaChar(fuelAmt);
    }

    public String getSumCumuMile() {
        return Util.addCommaChar(sumCumuMile);
    }

    public String getCumuMile() {
        return Util.addCommaChar(cumuMile);
    }
}