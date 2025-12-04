package com.edscorp.eds.speaker.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.domain.SpeakerSettingEntity;
import com.edscorp.eds.speaker.domain.SpeakerSettingId;
import com.edscorp.eds.speaker.repository.SpeakerSettingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SpeakerSettingService {

    private final SpeakerSettingRepository speakerSettingRepository;

    // 전체 조회
    public List<SpeakerSettingEntity> findAll() {
        return speakerSettingRepository.findAll();
    }

    // 특정 스피커 조회
    public SpeakerSettingEntity findSettingBySpeaker(String locationCode, String speakerCode) {
        SpeakerSettingId id = new SpeakerSettingId();

        id.setLocationCode(locationCode);
        id.setSpeakerCode(speakerCode);

        return speakerSettingRepository.findById(id)
                .orElse(null);
    }

    // 스피커 설정 저장
    public SpeakerSettingEntity save(SpeakerSettingEntity entity) {
        return speakerSettingRepository.save(entity);
    }

}
