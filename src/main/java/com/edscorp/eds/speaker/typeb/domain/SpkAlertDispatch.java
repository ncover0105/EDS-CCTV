package com.edscorp.eds.speaker.typeb.domain;

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
@Table(name = "tb_spk_alert_dispatch")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpkAlertDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispatch_key")
    private Integer dispatchKey; // 발령 키 (PK, AUTO_INCREMENT)

    @Column(name = "alert_key", nullable = false)
    private Integer alertKey; // 알림 키 (rainfall.tb_rain_alert 참조)

    @Column(name = "device_uid", nullable = false, length = 50)
    private String deviceUid; // 장비 UID

    @Column(name = "dispatch_type", length = 20)
    private String dispatchType; // 발령 타입 (manual, auto)

    @Column(name = "disaster_code", length = 20)
    private String disasterCode; // 재난 코드

    @Column(name = "tts_message", columnDefinition = "TEXT")
    private String ttsMessage; // TTS 메시지

    @Column(name = "alert_kind")
    private Integer alertKind; // 방송 종류 (1: TTS, 2/3: 재난 경보)

    @Column(name = "speaker_ids", columnDefinition = "TEXT")
    private String speakerIds; // 발령 대상 스피커 ID 목록 (JSON 문자열)

    @Column(name = "dispatch_status", length = 20)
    private String dispatchStatus; // 발령 상태 (pending, success, failed)

    @Column(name = "dispatch_id", length = 50)
    private String dispatchId; // 발령자 ID

    @Column(name = "dispatch_time")
    private LocalDateTime dispatchTime; // 발령 시간

    @Column(name = "col_way", length = 10)
    private String colWay; // 지역 코드

    @Column(name = "memo", length = 500)
    private String memo; // 메모

    @Column(name = "insert_time")
    private LocalDateTime insertTime; // 등록 일시
}
