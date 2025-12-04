package com.edscorp.eds.rainfall.vo.base;

import com.edscorp.eds.common.util.Util;

public class baseCorpListVO {
    private String corpCd;
    private String corpPersDivi;
    private String corpNo;
    private String corpRegNo;
    private String corpNm;
    private String ownerNm;
    private String zipNo;
    private String addr;
    private String addrDetail;
    private String telNo;
    private String faxNo;
    private String busiType;
    private String busiItem;
    private String useYn;

    public String getCorpCd() {
        return corpCd;
    }

    public void setCorpCd(String corpCd) {
        this.corpCd = corpCd;
    }

    public String getCorpPersDivi() {
        return corpPersDivi;
    }

    public void setCorpPersDivi(String corpPersDivi) {
        this.corpPersDivi = corpPersDivi;
    }

    public String getCorpNo() {
        return corpNo;
    }

    public void setCorpNo(String corpNo) {
        this.corpNo = Util.removeMinusChar(corpNo);
    }

    public String getCorpRegNo() {
        return corpRegNo;
    }

    public void setCorpRegNo(String corpRegNo) {
        this.corpRegNo = Util.removeMinusChar(corpRegNo);
    }

    public String getCorpNm() {
        return corpNm;
    }

    public void setCorpNm(String corpNm) {
        this.corpNm = corpNm;
    }

    public String getOwnerNm() {
        return ownerNm;
    }

    public void setOwnerNm(String ownerNm) {
        this.ownerNm = ownerNm;
    }

    public String getZipNo() {
        return zipNo;
    }

    public void setZipNo(String zipNo) {
        this.zipNo = zipNo;
    }

    public String getAddr() {
        return addr;
    }

    public void setAddr(String addr) {
        this.addr = addr;
    }

    public String getAddrDetail() {
        return addrDetail;
    }

    public void setAddrDetail(String addrDetail) {
        this.addrDetail = addrDetail;
    }

    public String getTelNo() {
        return telNo;
    }

    public void setTelNo(String telNo) {
        this.telNo = Util.removeMinusChar(telNo);
    }

    public String getFaxNo() {
        return faxNo;
    }

    public void setFaxNo(String faxNo) {
        this.faxNo = Util.removeMinusChar(faxNo);
    }

    public String getBusiType() {
        return busiType;
    }

    public void setBusiType(String busiType) {
        this.busiType = busiType;
    }

    public String getBusiItem() {
        return busiItem;
    }

    public void setBusiItem(String busiItem) {
        this.busiItem = busiItem;
    }

    public String getUseYn() {
        return useYn;
    }

    public void setUseYn(String useYn) {
        this.useYn = useYn;
    }
}