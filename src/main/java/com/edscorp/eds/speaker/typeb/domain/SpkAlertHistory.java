package com.edscorp.eds.speaker.typeb.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_alert_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkAlertHistory {

    @EmbeddedId
    private SpkAlertHistoryId id; // 복합키

    @Column(name = "speakerID", length = 20)
    private String speakerId; // 스피커 ID

    @Column(name = "alertTime")
    private LocalDateTime alertTime; // 요청시간

    @Column(name = "ResultTime")
    private LocalDateTime resultTime; // 응답시간

    @Column(name = "ResultMedia")
    private Integer resultMedia; // 1: LTE, 2: DMB

    @Column(name = "Ch1Result")
    private Integer ch1Result;

    @Column(name = "Ch2Result")
    private Integer ch2Result;

    @Column(name = "Ch3Result")
    private Integer ch3Result;

    @Column(name = "Ch4Result")
    private Integer ch4Result;

    @Column(name = "Result")
    private Integer result; // 0: 무응답, 1: 발령성공 등

}
