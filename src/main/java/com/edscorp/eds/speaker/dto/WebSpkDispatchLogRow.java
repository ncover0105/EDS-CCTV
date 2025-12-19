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
    private String mode;
    private String priority;
    private String disasterCode;
    private String ttsMessage;
    private String speakerId;
    private String requestUserId;

}
