package com.edscorp.eds.speaker.typeb.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BTypeAlertRequest {

    /** 대상 디바이스 ID */
    private String deviceId;

    /** 명령 코드 (예 : "41") */
    private String commandCode;

    /** 발령 파라미터 */
    private Integer alertMode; // 경보 모드
    private String disasterCode; // 재난 코드
    private Integer alertKind; // 1: TTS만, 2/3: 재난코드 기반
    private Integer alertRange; // 범위
    private Integer alertPriority; // 우선순위
    private String ttsMessage; // TTS 메시지

}
