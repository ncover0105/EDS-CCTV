package com.edscorp.eds.speaker.secondary.typeb.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.typeb.domain.SpkStatus;

public interface SpkStatusRepository extends JpaRepository<SpkStatus, Integer> {
    // 기본 findById(speakerKey) 사용
}
