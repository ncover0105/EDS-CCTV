package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import com.edscorp.eds.speaker.dto.SpeakerStatusId;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@IdClass(SpeakerStatusId.class)
@ToString
@Entity
@Getter
@Setter
@Table(name = "tb_speaker_status")
public class SpeakerStatusEntity {

    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Id
    @Column(name = "speakerCode")
    private String speakerCode;

    @Column(name = "conn_stat")
    private String connStat;

    @Column(name = "ac_stat")
    private String acStat;

    @Column(name = "dc_stat")
    private String dcStat;

    @Column(name = "battery", nullable = false)
    private int battery;

    @Column(name = "solar")
    private String solar;

    @Column(name = "lte")
    private String lte;

    @Column(name = "cpu_temp")
    private String cpuTemp;

    @Column(name = "mcu_ver")
    private String mcuVer;

    @Column(name = "created_time")
    private LocalDateTime createdTime;

    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

}
