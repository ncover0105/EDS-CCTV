package com.edscorp.eds.user.entity;

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

    @Column(name = "phnNo")
    private String phnNo;

    @Column(name = "user_role")
    private String role;

    @Column(name = "event_alert_yn", length = 1)
    private String eventAlertYn = "N";

    @Column(name = "warn_alert_yn", length = 1)
    private String warnAlertYn = "N";

    @Column(name = "alert_enabled_yn", length = 1)
    private String alertEnabledYn = "Y";

    // @Column(nullable = false)
    // private String role = "USER"; // 기본값으로 "USER" 역할 부여

}