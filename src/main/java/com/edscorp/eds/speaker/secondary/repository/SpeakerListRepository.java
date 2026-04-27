package com.edscorp.eds.speaker.secondary.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.SpeakerListEntity;
import com.edscorp.eds.speaker.secondary.domain.SpeakerListId;

public interface SpeakerListRepository extends JpaRepository<SpeakerListEntity, SpeakerListId> {

}
