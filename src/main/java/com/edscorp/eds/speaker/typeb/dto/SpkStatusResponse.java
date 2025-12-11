package com.edscorp.eds.speaker.typeb.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SpkStatusResponse {

    private String connectionStatus; // "정상", "이상" 등
    private String acStatus;
    private String dcStatus;
    private String batteryStatus;
    private String solarChargerStatus;
    private String lteAntennaStatus;
    private String cpuTemperature;
    private String mcuVersion;
    private LocalDateTime receiveTime;

}
