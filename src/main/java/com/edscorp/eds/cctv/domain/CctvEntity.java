package com.edscorp.eds.cctv.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_cctv_list")
public class CctvEntity {

    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Column(name = "cctvCode")
    private String cctvCode;

    @Column(name = "name")
    private String name;

    @Column(name = "mountpointId")
    private Integer mountpointId;

    @Column(name = "videoport")
    private Integer videoPort;

    @Column(name = "address")
    private String address;

    @Column(name = "id")
    private String id;

    @Column(name = "password")
    private String password;

    @Column(name = "rtspUrl")
    private String rtspUrl;

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

}