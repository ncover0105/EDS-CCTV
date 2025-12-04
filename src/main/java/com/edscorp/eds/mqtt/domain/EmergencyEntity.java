package com.edscorp.eds.mqtt.domain;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tb_emergency_log")
@Builder
public class EmergencyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cctvCode")
    private String cctvCode;

    @Column(name = "alertCode")
    private String alertCode;

    @Column(name = "boundaryNum")
    private Integer boundaryNum;

    @Column(name = "log")
    private String log;

    @Column(name = "inpDttm")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date inpDttm;

}