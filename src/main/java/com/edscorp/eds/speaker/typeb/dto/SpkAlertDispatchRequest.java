package com.edscorp.eds.speaker.typeb.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SpkAlertDispatchRequest {

    private Integer alertKey; // 알림 키
    private String deviceUid; // 장비 UID
    private String dispatchType; // manual / auto
    private String disasterCode; // 재난 코드
    private String ttsMessage; // TTS 메시지
    private Integer alertKind; // 방송 종류
    private String speakerIds; // JSON 문자열 (예: "[1,2,3]")
    private String dispatchId; // 발령자 ID
    private String colWay; // 지역 코드
    private String memo; // 메모

}
