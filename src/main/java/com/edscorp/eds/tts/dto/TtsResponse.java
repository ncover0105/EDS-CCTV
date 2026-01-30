package com.edscorp.eds.tts.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TtsResponse {
    private Long ttsId;
    private String ttsName;
    private String ttsMsg;
    private String ttsUseFlag;
    private LocalDateTime createdAt;
}
