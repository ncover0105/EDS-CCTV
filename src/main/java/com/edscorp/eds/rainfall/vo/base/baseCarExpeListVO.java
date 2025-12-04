package com.edscorp.eds.rainfall.vo.base;

import com.edscorp.eds.common.util.Util;

import lombok.Data;

@Data
public class baseCarExpeListVO {
    private String corpCd;
    private String corpNm;
    private String busiCd;
    private String busiNm;
    private String carCd;
    private String expeCd;
    private String apprDivi;
    private String expeDt;
    private String empCd;
    private String empNm;
    private String expeAmt;
    private String accountCd;
    private String accountNm;
    private String expeDivi;
    private String payDivi;
    private String projCd;
    private String projNm;
    private String depaCd;
    private String depaNm;
    private String note;
    private String inpId;
    private String inpNm;
    private String updId;
    private String updNm;

    public String getExpeDt() {
        return Util.addMinusChar(expeDt);
    }
}