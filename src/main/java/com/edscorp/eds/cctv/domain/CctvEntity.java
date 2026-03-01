package com.edscorp.eds.cctv.domain;

import java.time.LocalDateTime;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_cctv_list")
@IdClass(CctvId.class)
public class CctvEntity {

    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Id
    @Column(name = "cctvCode")
    private String cctvCode;

    @Column(name = "name")
    private String name;

    // ✅ Low / High를 Embedded VO로 관리
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "rtspUrl", column = @Column(name = "lowRtspUrl")),
            @AttributeOverride(name = "mountpointId", column = @Column(name = "lowMountpointId")),
            @AttributeOverride(name = "videoPort", column = @Column(name = "lowVideoPort"))
    })
    private CctvStream lowStream;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "rtspUrl", column = @Column(name = "highRtspUrl")),
            @AttributeOverride(name = "mountpointId", column = @Column(name = "highMountpointId")),
            @AttributeOverride(name = "videoPort", column = @Column(name = "highVideoPort"))
    })
    private CctvStream highStream;

    // quality로 스트림 조회
    public CctvStream getStream(StreamQuality quality) {
        return quality == StreamQuality.HIGH ? highStream : lowStream;
    }

    @Column(name = "id")
    private String id;

    @Column(name = "password")
    private String password;

    @Column(name = "address")
    private String address;

    @Column(name = "type")
    private String type;

    @Column(name = "wsPort")
    private String wsPort;

    @Column(name = "latitude")
    private String latitude;

    @Column(name = "longitude")
    private String longitude;

    @Column(name = "statusCam")
    private String statusCam;

    @Column(name = "statusProc")
    private String statusProc;

    @Column(name = "statusCamUpdatedAt")
    private LocalDateTime statusCamUpdatedAt;
}