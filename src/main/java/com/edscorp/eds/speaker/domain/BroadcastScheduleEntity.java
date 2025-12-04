package com.edscorp.eds.speaker.domain;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_broadcast_schedule")
@Getter
@Setter
@NoArgsConstructor
public class BroadcastScheduleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheduleId")
    private Long scheduleId;

    @Column(name = "scheduleName")
    private String scheduleName;

    @Column(name = "startTime")
    private LocalTime startTime;

    @Column(name = "endTime")
    private LocalTime endTime;

    @Column(name = "playType")
    private String playType;

    @Column(name = "folderName")
    private String folderName;

    @Column(name = "repeatEnabled")
    private Boolean repeatEnabled;

    @Column(name = "sun")
    private Boolean sun;

    @Column(name = "mon")
    private Boolean mon;

    @Column(name = "tue")
    private Boolean tue;

    @Column(name = "wed")
    private Boolean wed;

    @Column(name = "thu")
    private Boolean thu;

    @Column(name = "fri")
    private Boolean fri;

    @Column(name = "sat")
    private Boolean sat;

    @Column(name = "createTime", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createTime;

    @Column(name = "updateTime", insertable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleSpeaker> scheduleSpeakers = new ArrayList<>();

    public void addSpeaker(ScheduleSpeaker scheduleSpeaker) {
        scheduleSpeaker.setSchedule(this);
        this.scheduleSpeakers.add(scheduleSpeaker);
    }

    public void removeSpeaker(ScheduleSpeaker scheduleSpeaker) {
        this.scheduleSpeakers.remove(scheduleSpeaker);
        scheduleSpeaker.setSchedule(null);
    }

}
