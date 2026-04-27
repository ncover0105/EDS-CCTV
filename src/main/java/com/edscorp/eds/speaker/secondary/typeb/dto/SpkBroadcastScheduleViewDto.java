package com.edscorp.eds.speaker.secondary.typeb.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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
public class SpkBroadcastScheduleViewDto {
    private Long scheduleId;
    private String scheduleName;
    private String enabledYn;

    private LocalTime startTime;
    private LocalTime endTime;

    private String repeatEnabled;
    private String mon;
    private String tue;
    private String wed;
    private String thu;
    private String fri;
    private String sat;
    private String sun;

    private String bcMode;
    private String bcAlertType;
    private String bcBroadcastType;
    private String bcPriority;
    private String bcScope;

    private String disasterCode;
    private String ttsMessage;

    // 원본 JSON(원하면 내려주고, 아니면 생략해도 됨)
    private String speakerIds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 스피커 상세 목록
    private List<SpkConfigDto> speakers;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SpkConfigDto {
        private Integer speakerKey;
        private String speakerId;
        private String speakerName;
        private String locationCode;
        private String locationName;
        private String speakerAdr;
        private String speakerLatitude;
        private String speakerLongitude;
    }
}
