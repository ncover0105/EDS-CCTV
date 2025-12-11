package com.edscorp.eds.speaker.typeb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.SpkTestResultEntity;
import com.edscorp.eds.speaker.typeb.domain.SpkTestResultId;

public interface SpkTestResultRepository extends JpaRepository<SpkTestResultEntity, SpkTestResultId> {

    List<SpkTestResultEntity> findBySpeakerInfoAutokey(Integer speakerInfoAutokey);

}
