package com.edscorp.eds.rainfall.vo.global;

import lombok.Data;

@Data
public class RAINDATALISTVO {
    private String UID;
    private String name;

    private String colway;
    private String EventTime;
    private String r_acc_now_51;
    private String r_abs_hour;
    private String r_abs_today;
    private String r_abs_yesterday;
    private String r_abs_year;
    private String r_abs_month;
    private String min_sum_10;
    private String min_sum;
    private String rainMaxTime;
    private String rainMax;

    private  String r_abs_week;
}