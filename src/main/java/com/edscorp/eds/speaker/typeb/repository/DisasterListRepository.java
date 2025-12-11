package com.edscorp.eds.speaker.typeb.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.DisasterListEntity;

public interface DisasterListRepository extends JpaRepository<DisasterListEntity, String> {
    Optional<DisasterListEntity> findByDstCd(String dstcd);
}
