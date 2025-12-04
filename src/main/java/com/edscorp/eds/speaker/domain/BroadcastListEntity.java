package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tb_broadcast_list")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BroadcastListEntity {

    @Id
    @Column(name = "broadcast_CODE", length = 255)
    private String code;

    @Column(name = "type", length = 50)
    private String type; // NORMAL, WARNING, DANGER, TEST

    @Column(name = "icon", length = 255)
    private String icon;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "text", length = 255)
    private String text;

    @Column(name = "useInfo")
    private Integer useInfo; // 1=사용, 0=미사용

    @Column(name = "audio_file", length = 255)
    private String audioFile;

    @Column(name = "created_dttm", nullable = false, updatable = false)
    private LocalDateTime createdDttm;

    @Column(name = "updated_dttm")
    private LocalDateTime updatedDttm;

    @PrePersist
    public void prePersist() {
        createdDttm = LocalDateTime.now();
        updatedDttm = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedDttm = LocalDateTime.now();
    }
}
