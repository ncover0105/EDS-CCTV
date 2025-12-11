package com.edscorp.eds.speaker.typeb.domain;

import groovy.transform.builder.Builder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_spk_disaster_list")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkDisaster {

    @Id
    @Column(name = "dst_cd", length = 3)
    private String dstCode; // 재난 코드 (PK)

    @Column(name = "dst_name", length = 255)
    private String dstName; // 재난명

    @Column(name = "dst_priority")
    private Integer dstPriority; // 우선순위

    @Column(name = "dst_siren_code", length = 255)
    private String dstSirenCode; // 사이렌 코드

    @Column(name = "dst_sto_cd", length = 255)
    private String dstStoCode; // 저장 코드

    @Column(name = "dst_sto_msg", columnDefinition = "TEXT")
    private String dstStoreMsg; // 고정 메시지(TEXT)

    @Column(name = "dst_use_flag", length = 255)
    private String dstUseFlag; // 사용 여부 (Y/N)
}
