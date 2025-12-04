package com.edscorp.eds.mqtt.domain;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "tb_cctv_boundary")
public class BoundaryInfoEntity {

    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Column(name = "cctvCode")
    private String cctvCode;

    @Column(name = "presetNum")
    private Integer presetNum;

    @Column(name = "boundaryType")
    private String boundaryType;

    @Column(name = "boundaryNum")
    private String boundaryNum;

    @Column(name = "targetPointX")
    private Double targetPointX;

    @Column(name = "targetPointY")
    private Double targetPointY;

    @Column(name = "data")
    private String data;

    @Column(name = "inpDttm")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date inpDttm;

    @Column(name = "updDttm")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date updDttm;

}
