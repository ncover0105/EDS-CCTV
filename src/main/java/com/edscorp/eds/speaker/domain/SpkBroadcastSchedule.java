package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_broadcast_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkBroadcastSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "schedule_name")
    private String scheduleName;

    @Column(name = "enabled_yn")
    private String enabledYn;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "repeat_enabled")
    private String repeatEnabled;

    @Column(name = "mon")
    private String mon;

    @Column(name = "tue")
    private String tue;

    @Column(name = "wed")
    private String wed;

    @Column(name = "thu")
    private String thu;

    @Column(name = "fri")
    private String fri;

    @Column(name = "sat")
    private String sat;

    @Column(name = "sun")
    private String sun;

    @Column(name = "bc_mode")
    private String bcMode;

    @Column(name = "bc_alert_type")
    private String bcAlertType;

    @Column(name = "bc_broadcast_type")
    private String bcBroadcastType;

    @Column(name = "bc_priority")
    private String bcPriority;

    @Column(name = "bc_scope")
    private String bcScope;

    @Column(name = "disaster_code")
    private String disasterCode;

    @Column(name = "tts_message", columnDefinition = "TEXT")
    private String ttsMessage;

    @Column(name = "speaker_ids", columnDefinition = "TEXT")
    private String speakerIds;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
