package com.edscorp.eds.speaker.secondary.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
public class SpeakerActionRequest {
    private String speakerId;
    private String action;
    private String extraParam;
}
