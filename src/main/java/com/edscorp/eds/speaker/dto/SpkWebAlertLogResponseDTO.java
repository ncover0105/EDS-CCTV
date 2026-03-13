package com.edscorp.eds.speaker.dto;

import java.time.LocalDateTime;

import com.edscorp.eds.speaker.domain.SpkWebAlertLogEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SpkWebAlertLogResponseDTO {
    private Long id;
    private String deviceId;
    private String commandCode;
    private String bgmReqType;

    private Integer alertMode;
    private String disasterCode;

    private Integer alertKind;
    private Integer alertRange;
    private Integer alertPriority;

    private String ttsMessage;
    private String alertStoCd;
    private String alertSirenCd;

    private String status; // SENT, FAILED
    private LocalDateTime createdAt;

    public static SpkWebAlertLogResponseDTO from(SpkWebAlertLogEntity e) {
        return SpkWebAlertLogResponseDTO.builder()
                .id(e.getId())
                .deviceId(e.getDeviceId())
                .commandCode(e.getCommandCode())
                .bgmReqType(e.getBgmReqType())
                .alertMode(e.getAlertMode())
                .disasterCode(e.getDisasterCode())
                .alertKind(e.getAlertKind())
                .alertRange(e.getAlertRange())
                .alertPriority(e.getAlertPriority())
                .ttsMessage(e.getTtsMessage())
                .alertStoCd(e.getAlertStoCd())
                .alertSirenCd(e.getAlertSirenCd())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
