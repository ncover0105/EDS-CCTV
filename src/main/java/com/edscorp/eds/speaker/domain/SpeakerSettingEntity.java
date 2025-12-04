package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@IdClass(SpeakerSettingId.class)
@Table(name = "tb_speaker_setting")
public class SpeakerSettingEntity {
    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Id
    @Column(name = "speakerCode")
    private String speakerCode;

    // ========== 볼륨 설정 ==========
    private Integer bgm_ch1;
    private Integer bgm_ch2;
    private Integer bgm_ch3;
    private Integer bgm_ch4;

    private Integer alert_ch1;
    private Integer alert_ch2;
    private Integer alert_ch3;
    private Integer alert_ch4;

    private Integer fm_ch1;
    private Integer fm_ch2;
    private Integer fm_ch3;
    private Integer fm_ch4;

    // ========== 채널 사용 ==========
    private Integer use_ch1;
    private Integer use_ch2;
    private Integer use_ch3;
    private Integer use_ch4;

    // ========== 상세 설정 ==========
    private String bgm_folder;
    private String bgm_status;
    private Integer bgm_input_volume;

    private Integer msg_volume;
    private Integer tts_volume;
    private Integer fm_volume;

    private Integer tts_pitch;
    private Integer tts_speed;

    private Integer polling_interval;

    private String sound_mode;
    private String frequency;

    @Column(name = "frequency_region")
    private String frequencyRegion;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
