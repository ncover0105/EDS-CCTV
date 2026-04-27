package com.edscorp.eds.speaker.secondary.typeb.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BTypeActionRequest {

    /** JS의 action 값 (time, status, reset, getVolume, insBgmVolume 등) */
    private String action;

    /** 선택된 스피커 ID 리스트 (JS의 speakerIds) */
    private List<String> speakerIds;

    /** JS extraParam에 해당. 예: 'insBgmVolume' 일 때 '0100' 뒤에 붙는 HEX 값 등 */
    private String extraParam;

    /** 제어 명령 전송 시 필요한 비밀번호 (PlayRadio 연동용) */
    private String password;
}
