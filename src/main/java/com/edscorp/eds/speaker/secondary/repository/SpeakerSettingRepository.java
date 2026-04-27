package com.edscorp.eds.speaker.secondary.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.SpeakerSettingEntity;

public interface SpeakerSettingRepository
        extends JpaRepository<SpeakerSettingEntity, Integer> {

}
