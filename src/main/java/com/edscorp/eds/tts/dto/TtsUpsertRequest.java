package com.edscorp.eds.tts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TtsUpsertRequest {

    private String ttsName;
    private String ttsMsg;

    @Builder.Default
    private String ttsUseFlag = "Use";
}
