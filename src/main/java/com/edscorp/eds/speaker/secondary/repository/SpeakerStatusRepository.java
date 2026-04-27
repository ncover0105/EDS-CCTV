package com.edscorp.eds.speaker.secondary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.SpeakerStatusEntity;
import com.edscorp.eds.speaker.secondary.dto.SpeakerStatusId;

public interface SpeakerStatusRepository extends JpaRepository<SpeakerStatusEntity, SpeakerStatusId> {

    List<SpeakerStatusEntity> findByLocationCodeAndSpeakerCode(String locationCode, String speakerCode);

}
