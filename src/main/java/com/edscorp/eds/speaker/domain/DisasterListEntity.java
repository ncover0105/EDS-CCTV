package com.edscorp.eds.speaker.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_disaster_list")
public class DisasterListEntity {

    // ======= 재난 코드 =======
    @Id
    @Column(name = "dst_cd")
    private String dstCd;

    @Column(name = "dst_sto_cd")
    private String dstStoCd;

    @Column(name = "dst_sto_msg")
    private String dstStoMsg;

    @Column(name = "dst_priority")
    private Integer dstPriority;

    @Column(name = "dst_siren_code")
    private String dstSirenCode;

    @Column(name = "dst_name")
    private String dstName;

}
