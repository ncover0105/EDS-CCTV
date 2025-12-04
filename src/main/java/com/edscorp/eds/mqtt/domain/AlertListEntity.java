package com.edscorp.eds.mqtt.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "tb_alert_list")
public class AlertListEntity {

    @Id
    @Column(name = "alertCode")
    private String alertCode;

    @Column(name = "message")
    private String message;

}
