package com.edscorp.eds.speaker.typeb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.SpkConfig;

public interface SpkConfigRepository extends JpaRepository<SpkConfig, Integer> {

    // speakerId 기준 조회
    SpkConfig findBySpeakerId(String speakerId);

    // 지역 코드 기준 조회
    List<SpkConfig> findByLocationCode(String locationCode);

    // 삭제 여부 기반 조회 (00 미삭제 / 01 삭제)
    List<SpkConfig> findBySaveDivi(String saveDivi);
}
