package com.edscorp.eds.speaker.typeb.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_test_result")
@IdClass(SpkTestResultId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkTestResultEntity {

    @Id
    @Column(name = "SpeakerInfoAutokey")
    private Integer speakerInfoAutokey;

    @Id
    @Column(name = "TestTime")
    private LocalDateTime testTime;

    @Column(name = "ResultTime")
    private LocalDateTime resultTime;

    @Column(name = "Ch1Result")
    private Integer ch1Result;

    @Column(name = "Ch2Result")
    private Integer ch2Result;

    @Column(name = "Ch3Result")
    private Integer ch3Result;

    @Column(name = "Ch4Result")
    private Integer ch4Result;
}
