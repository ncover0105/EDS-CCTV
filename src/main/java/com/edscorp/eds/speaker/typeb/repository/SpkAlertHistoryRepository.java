package com.edscorp.eds.speaker.typeb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.SpkAlertHistory;
import com.edscorp.eds.speaker.typeb.domain.SpkAlertHistoryId;

public interface SpkAlertHistoryRepository extends JpaRepository<SpkAlertHistory, SpkAlertHistoryId> {

    // 스피커 기준 발령 이력 조회
    List<SpkAlertHistory> findByIdSpeakerKeyOrderByAlertTimeDesc(Integer speakerKey);

    // alertHistKey 기준 단일 조회
    List<SpkAlertHistory> findByIdAlertHistKey(Integer alertHistKey);

}
