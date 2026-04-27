package com.edscorp.eds.speaker.secondary.dto;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpkWebAlertLogSearchRequest {
    private String deviceId;
    private Integer alertMode;
    private Integer alertPriority;

    // 특정일 조회 (하루)
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    // 기간 조회
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate to;
}
