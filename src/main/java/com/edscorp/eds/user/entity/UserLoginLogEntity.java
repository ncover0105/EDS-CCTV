package com.edscorp.eds.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_user_login_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLoginLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "login_ip", nullable = false)
    private String loginIp;

    @Builder.Default
    @Column(name = "login_dttm", nullable = false)
    private LocalDateTime loginDttm = LocalDateTime.now();
}
