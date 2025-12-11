package com.edscorp.eds.speaker.typeb.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.typeb.repository.SpkConfigRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpkConfigService {

    private final SpkConfigRepository repository;

    public SpkConfig getSpeakerByKey(Integer key) {
        return repository.findById(key).orElse(null);
    }

    public SpkConfig getSpeakerById(String speakerId) {
        return repository.findBySpeakerId(speakerId);
    }

    public List<SpkConfig> getSpeakersByLocation(String locationCode) {
        return repository.findByLocationCode(locationCode);
    }

    public List<SpkConfig> getActiveSpeakers() {
        return repository.findBySaveDivi("00"); // 미삭제 스피커
    }
}
