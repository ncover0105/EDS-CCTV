package com.edscorp.eds.weather.dto;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tb_weather_warning_list", indexes = {
        @Index(name = "WRN_TM_FC_TM_EF_LVL_CMD_SEND", columnList = "WRN,TM_FC,TM_EF,LVL,CMD,SEND")
})
@Getter
@Setter
public class TbWeatherWarningList {
    @EmbeddedId
    private TbWeatherWarningListKey id;

    @Column(name = "TM_FC", length = 12)
    private String tmFc;

    @Column(name = "TM_EF", length = 12)
    private String tmEf;

    @Column(name = "LVL", length = 10)
    private String lvl;

    @Column(name = "CMD", length = 10)
    private String cmd;

    @Column(name = "GRD", length = 10)
    private String grd;

    @Column(name = "CNT", length = 10)
    private String cnt;

    @Column(name = "RPT", length = 10)
    private String rpt;

    @Column(name = "SEND", length = 10)
    private String send;
}
