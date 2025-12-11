package com.edscorp.eds.speaker.typeb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;

public interface SpkDisasterRepository extends JpaRepository<SpkDisaster, String> {

    // 사용 중인 재난 코드 조회 (예: Y)
    List<SpkDisaster> findByDstUseFlag(String useFlag);

    // 이름 포함 검색
    List<SpkDisaster> findByDstNameContaining(String keyword);
}
