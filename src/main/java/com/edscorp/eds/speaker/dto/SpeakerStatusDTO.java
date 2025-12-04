package com.edscorp.eds.speaker.dto;

import lombok.Data;

@Data
public class SpeakerStatusDTO {
    private String locationCode;
    private String speakerCode;
    private String connStat;
    private String acStat;
    private String dcStat;
    private String battery;
    private String solar;
    private String lte;
    private String cpuTemp;
    private String mcuVer;
}
