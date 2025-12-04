package com.edscorp.eds.mqtt.domain;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tb_cctv_list")
public class PowerStatusEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "locationCode")
    private String locationCode;

    @Column(name = "cctvCode")
    private String cctvCode;

    @Column(name = "alertCode")
    private String alertCode;

    @Column(name = "statusCam")
    private String status_cam;

    @Column(name = "statusProc")
    private String status_proc;

    @Column(name = "rtspUrl")
    private String rtsp_ip;

    @Column(name = "receptionDttm")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date receptionDttm;
}
