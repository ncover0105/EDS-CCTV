package com.edscorp.eds.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_user_list")
public class UserEntity {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "pw")
    private String pw;

    @Column(name = "name")
    private String name;

    @Column(name = "email")
    private String email;

    @Column(name = "phnNo")
    private String phnNo;

    @Column(name = "telNo")
    private String telNo;

    @Column(name = "user_role")
    private String role;

    @Column(name = "event_alert_yn", length = 1)
    private String eventAlertYn = "N";

    @Column(name = "warn_alert_yn", length = 1)
    private String warnAlertYn = "N";

    @Column(name = "alert_enabled_yn", length = 1)
    private String alertEnabledYn = "Y";

    @Column(name = "inpDttm", updatable = false)
    private LocalDateTime inpDttm;

    @Column(name = "updDttm")
    private LocalDateTime updDttm;

}