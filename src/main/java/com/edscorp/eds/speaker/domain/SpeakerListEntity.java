package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_speaker_list")
@IdClass(SpeakerListId.class)
public class SpeakerListEntity {

    @Id
    @Column(name = "locationCode")
    private String locationCode;

    @Id
    @Column(name = "speakerCode")
    private String speakerCode;

    @Column(name = "name")
    private String speakerName;

    @Column(name = "id")
    private String id;

    @Column(name = "password")
    private String password;

    @Column(name = "url")
    private String url;

    @Column(name = "latitude")
    private String lat;

    @Column(name = "longitude")
    private String lng;

    @Column(name = "installAddress")
    private String speakerAdr;

    @Column(name = "saveDivi")
    private String saveDivi;

    @Column(name = "conn_stat")
    private String connStat;

    @Column(name = "recv_time")
    private LocalDateTime recvTime;

    @Column(name = "phone")
    private String phone;

    @Column(name = "use_info")
    private Integer useInfo;

    @Column(name = "speakerKey")
    private String speakerKey;

    @Column(name = "manufacturer")
    private String manufacturer;
}
