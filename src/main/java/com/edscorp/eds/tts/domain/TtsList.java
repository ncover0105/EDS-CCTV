package com.edscorp.eds.tts.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_spk_tts_list")
public class TtsList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tts_id")
    private Long ttsId;

    @Column(name = "tts_name", nullable = false, length = 100)
    private String ttsName;

    @Lob
    @Column(name = "tts_msg", nullable = false)
    private String ttsMsg;

    @Column(name = "tts_use_flag", nullable = false)
    @Builder.Default
    private Boolean ttsUseFlag = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}