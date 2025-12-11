package com.edscorp.eds.speaker.typeb.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "tb_spk_status")
public class SpkStatus {

    @Id
    @Column(name = "speakerKey")
    private Integer speakerKey;

    @Column(name = "receiveTime")
    private LocalDateTime receiveTime;

    @Column(name = "connectStatus")
    private Integer connectStatus; // 0:정상, 1:이상

    @Column(name = "speakerStatus")
    private Integer speakerStatus;

    @Column(name = "solarInput")
    private Integer solarInput;

    @Column(name = "acInput")
    private Integer acInput;

    @Column(name = "battery")
    private Integer battery;

    @Column(name = "dcInput")
    private Integer dcInput;

    @Column(name = "ampPowerStatus")
    private Integer ampPowerStatus;

    @Column(name = "lteStatus")
    private Integer lteStatus;

    @Column(name = "dmbStatus")
    private Integer dmbStatus;

    @Column(name = "cpuTemp")
    private Float cpuTemp;

    @Column(name = "MCUVersion")
    private String mcuVersion;

}
