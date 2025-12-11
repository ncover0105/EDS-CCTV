package com.edscorp.eds.speaker.typeb.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_system_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkSystemConfigEntity {

    @Id
    @Column(name = "config_key", length = 50)
    private String configKey; // 설정 키 (PK)

    @Column(name = "config_value", length = 500)
    private String configValue; // 설정 값

    @Column(name = "config_desc", length = 200)
    private String configDesc; // 설명

    @Column(name = "config_type", length = 20)
    private String configType; // string, number, boolean, password

    @Column(name = "insert_time")
    private LocalDateTime insertTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
