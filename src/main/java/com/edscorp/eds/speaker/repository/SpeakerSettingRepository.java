package com.edscorp.eds.speaker.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.domain.SpeakerSettingEntity;

public interface SpeakerSettingRepository
        extends JpaRepository<SpeakerSettingEntity, Integer> {

}
