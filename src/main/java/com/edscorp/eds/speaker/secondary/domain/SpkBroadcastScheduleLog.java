package com.edscorp.eds.speaker.secondary.domain;

import java.time.LocalDateTime;

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
@Table(name = "tb_spk_broadcast_schedule_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkBroadcastScheduleLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispatch_id")
    private Long dispatchId;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "dispatched_at", nullable = false)
    private LocalDateTime dispatchedAt;

    @Column(name = "target_count", nullable = false)
    private Integer targetCount;

    @Column(name = "requested_by", length = 50)
    private String requestedBy;

    @Column(name = "memo", length = 500)
    private String memo;

    @Column(name = "bc_mode", nullable = false, length = 10)
    private String bcMode;

    @Column(name = "bc_alert_type", nullable = false, length = 10)
    private String bcAlertType;

    @Column(name = "bc_broadcast_type", nullable = false, length = 10)
    private String bcBroadcastType;

    @Column(name = "bc_priority", nullable = false, length = 10)
    private String bcPriority;

    @Column(name = "bc_scope", nullable = false, length = 10)
    private String bcScope;

    @Column(name = "disaster_code", nullable = false, length = 50)
    private String disasterCode;

    @Column(name = "tts_message", columnDefinition = "TEXT")
    private String ttsMessage;

    @jakarta.persistence.PrePersist
    void onCreate() {
        if (this.dispatchedAt == null) {
            this.dispatchedAt = LocalDateTime.now();
        }
        if (this.targetCount == null) {
            this.targetCount = 0;
        }
    }
}

