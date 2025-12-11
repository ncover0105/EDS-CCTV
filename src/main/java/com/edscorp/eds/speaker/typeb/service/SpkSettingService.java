package com.edscorp.eds.speaker.typeb.service;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkSettingEntity;
import com.edscorp.eds.speaker.typeb.repository.SpkSettingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpkSettingService {

    private final SpkSettingRepository spkSettingRepository;

    public SpkSettingEntity getSetting(Integer speakerKey) {
        return spkSettingRepository.findById(speakerKey).orElse(null);
    }

    public SpkSettingEntity saveSetting(SpkSettingEntity setting) {
        return spkSettingRepository.save(setting);
    }
}
