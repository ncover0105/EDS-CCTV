package com.edscorp.eds.speaker.typeb.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "speakerKey")
    private Integer speakerKey; // PK (AUTO_INCREMENT)

    @Column(name = "speakerId", length = 20, nullable = false)
    private String speakerId; // 단말 ID

    @Column(name = "OrderGroupAutokey")
    private Integer orderGroupAutokey; // 발령 그룹 ID

    @Column(name = "speakerName", length = 20)
    private String speakerName; // 단말명

    @Column(name = "saveDivi", length = 4)
    private String saveDivi; // 00: 미삭제, 01: 삭제

    @Column(name = "CDMANumber", length = 12)
    private String cdmaNumber; // CDMA 번호

    @Column(name = "Description", length = 300)
    private String description; // 비고

    @Column(name = "UserInfoAutokey")
    private Integer userInfoAutokey; // 삭제자 유저키

    @Column(name = "DeleteTime")
    private LocalDateTime deleteTime;

    @Column(name = "CreateTime")
    private LocalDateTime createTime;

    @Column(name = "UpdateTime")
    private LocalDateTime updateTime;

    @Column(name = "locationCode", length = 20)
    private String locationCode; // 지역 코드

    @Column(name = "locationName", length = 100)
    private String locationName; // 지역명

    @Column(name = "speakerAdr", length = 255)
    private String speakerAdr; // 스피커 접속 주소

    @Column(name = "speakerLatitude", precision = 12, scale = 6)
    private BigDecimal speakerLatitude;

    @Column(name = "speakerLongitude", precision = 12, scale = 6)
    private BigDecimal speakerLongitude;
}
