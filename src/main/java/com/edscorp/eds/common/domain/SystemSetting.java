package com.edscorp.eds.common.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "tb_system_setting")
public class SystemSetting {

    @Id
    private Long id;

    private boolean autoApproval;
    private int mode;
    private String media;
    private String type;
    private String mapApiKey;

    private LocalDateTime updatedAt;
}
