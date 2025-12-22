package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_spk_web_dispatch_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TbWebSpkDispatchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_key")
    private Long logKey;

    @Column(name = "dispatch_time", nullable = false)
    private LocalDateTime dispatchTime;

    @Column(name = "dispatch_type", nullable = false, length = 20)
    private String dispatchType; // manual/auto

    @Column(name = "mode", length = 10)
    private String mode; // REAL/TEST

    @Column(name = "alert_type", length = 10)
    private String alertType; // CFW/ACL...

    @Column(name = "broadcast_type", length = 10)
    private String broadcastType; // TTS/STORED/ETC

    @Column(name = "priority", length = 10)
    private String priority; // NONE/CAUTION/WARNING/DANGER

    @Column(name = "scope", length = 10)
    private String scope; // SPEAKER/SIDO/GUN

    @Column(name = "disaster_code", length = 50)
    private String disasterCode;

    @Lob
    @Column(name = "tts_message", columnDefinition = "TEXT")
    private String ttsMessage;

    @Column(name = "command_code", length = 10)
    private String commandCode; // ex) 41

    @Column(name = "speaker_id", length = 50)
    private String speakerId; // 단일이면 사용

    @Lob
    @Column(name = "speaker_ids", columnDefinition = "TEXT")
    private String speakerIds; // JSON 문자열

    @Column(name = "request_user_id", length = 50)
    private String requestUserId;

    @Column(name = "request_ip", length = 45)
    private String requestIp;

    @Column(name = "request_ua", length = 255)
    private String requestUa;

    @Column(name = "memo", length = 500)
    private String memo;

    @PrePersist
    void onCreate() {
        if (this.dispatchTime == null)
            this.dispatchTime = LocalDateTime.now();
        if (this.dispatchType == null || this.dispatchType.isBlank())
            this.dispatchType = "MANUAL";
    }
}
