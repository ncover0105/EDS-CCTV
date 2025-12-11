package com.edscorp.eds.speaker.typeb.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkSystemConfigEntity;
import com.edscorp.eds.speaker.typeb.repository.SpkSystemConfigRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SpkSystemConfigService {

    private final SpkSystemConfigRepository spkSystemConfigRepository;

    // 전체 설정 조회
    public List<SpkSystemConfigEntity> getAllConfigs() {
        return spkSystemConfigRepository.findAll();
    }

    // 단일 설정 조회
    public SpkSystemConfigEntity getConfig(String key) {
        return spkSystemConfigRepository.findById(key).orElse(null);
    }

    // 설정 저장 또는 수정
    public SpkSystemConfigEntity saveConfig(SpkSystemConfigEntity config) {
        return spkSystemConfigRepository.save(config);
    }
}
