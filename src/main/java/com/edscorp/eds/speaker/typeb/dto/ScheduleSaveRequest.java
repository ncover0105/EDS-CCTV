package com.edscorp.eds.speaker.typeb.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScheduleSaveRequest {
    private String scheduleName;
    private String enabledYn;
    private String startTime;
    private String endTime;

    private String repeatEnabled;
    private String mon;
    private String tue;
    private String wed;
    private String thu;
    private String fri;
    private String sat;
    private String sun;

    private String bcMode;
    private String bcAlertType;
    private String bcBroadcastType;
    private String bcPriority;
    private String bcScope;
    private String disasterCode;
    private String ttsMessage;

    private List<String> speakerIds;
}
