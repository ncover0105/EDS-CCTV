package com.edscorp.eds.speaker.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WebSpkDispatchLogRow {

    private Long logKey;
    private LocalDateTime dispatchTime;

    private String dispatchType;
    private String broadcastType;
    private String mode;
    private String priority;

    private String scope;
    private String commandCode;

    private String disasterCode;
    private String disasterName;
    private Integer disasterPriority;
    private String defaultMessage;

    private String ttsMessage;
    private String memo;

    private String speakerId;
    private String speakerIds;

    private String requestUserId;
    private String requestIp;
}
