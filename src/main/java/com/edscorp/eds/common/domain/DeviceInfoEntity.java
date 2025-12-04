package com.edscorp.eds.common.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_device_info")
public class DeviceInfoEntity {

    @Id
    @Column(name = "deviceId")
    private String deviceId;

    @Column(name = "deviceName")
    private String deviceName;

    @Column(name = "mapName")
    private String mapName;

    @Column(name = "latitude")
    private String latitude;

    @Column(name = "longitude")
    private String longitude;

    @Column(name = "address")
    private String address;

    @Column(name = "phone")
    private String phone;

}
