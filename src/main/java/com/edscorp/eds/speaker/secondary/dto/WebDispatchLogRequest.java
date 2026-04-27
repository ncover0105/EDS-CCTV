package com.edscorp.eds.speaker.secondary.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebDispatchLogRequest {
    private String dispatchType; // manual/auto (없으면 manual)
    private String mode; // REAL/TEST
    private String alertType; // CFW/ACL
    private String broadcastType; // TTS/STORED/ETC
    private String priority; // NONE/CAUTION/WARNING/DANGER
    private String scope; // SPEAKER/SIDO/GUN
    private String disasterCode;
    private String tts; // TTS 메시지

    private String commandCode; // "41" 등
    private String speakerId; // 단일
    private List<String> speakerIds; // 다중이면 사용

    private String memo;
    private LocalDateTime dispatchTime; // 발령 이벤트 발생 시각

}
