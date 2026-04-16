package com.edscorp.eds.common.domain;

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
@Table(name = "tb_system_setting")
public class SystemSetting {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "autoApproval", nullable = false)
    private boolean autoApproval;

    @Column(name = "mode", nullable = false)
    private int mode;

    @Column(name = "media")
    private String media;

    @Column(name = "type")
    private String type;

    @Column(name = "mapApiKey")
    private String mapApiKey;

    @Column(name = "riskMode", nullable = false)
    private int riskMode;

    @Column(name = "riskSec", nullable = false)
    private int riskSec;

    @Column(name = "riskAutoBcast", nullable = false)
    private boolean riskAutoBcast;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt;
}