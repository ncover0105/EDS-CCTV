package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_web_alert_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkWebAlertLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false, length = 64)
    private String deviceId;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "command_code", nullable = false, length = 32)
    private String commandCode;

    @Column(name = "bgm_req_type", length = 2)
    private String bgmReqType; // 00: OFF 요청, 01: ON 요청 (BGM 명령일 때만 사용)

    @Column(name = "alert_mode", nullable = false)
    private Integer alertMode;

    @Column(name = "disaster_code", nullable = false, length = 16)
    private String disasterCode;

    @Column(name = "alert_kind", nullable = false)
    private Integer alertKind;

    @Column(name = "alert_range", nullable = false)
    private Integer alertRange;

    @Column(name = "alert_priority", nullable = false)
    private Integer alertPriority;

    @Lob
    @Column(name = "tts_message", nullable = false)
    private String ttsMessage;

    @Column(name = "alert_sto_cd", nullable = false, length = 16)
    private String alertStoCd;

    @Column(name = "alert_siren_cd", nullable = false, length = 16)
    private String alertSirenCd;

    @Column(name = "status", nullable = false, length = 8)
    private String status; // SENT, FAILED

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "client_ip", length = 45)
    private String clientIp;
}
