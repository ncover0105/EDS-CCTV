package com.edscorp.eds.speaker.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.domain.SpeakerListEntity;
import com.edscorp.eds.speaker.domain.SpeakerListId;

public interface SpeakerListRepository extends JpaRepository<SpeakerListEntity, SpeakerListId> {

}
