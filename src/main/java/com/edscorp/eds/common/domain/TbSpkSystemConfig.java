package com.edscorp.eds.common.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_spk_system_config")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TbSpkSystemConfig {

    @Id
    @Column(name = "config_key", length = 50, nullable = false)
    private String configKey;

    @Column(name = "config_value", length = 500)
    private String configValue;

    @Column(name = "config_desc", length = 200)
    private String configDesc;

    @Column(name = "config_type", length = 20)
    private String configType;

    @Column(name = "insert_time")
    private LocalDateTime insertTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;
}