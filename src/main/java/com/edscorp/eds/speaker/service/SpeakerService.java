package com.edscorp.eds.speaker.service;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.domain.BroadcastListEntity;
import com.edscorp.eds.speaker.domain.SpeakerListEntity;
import com.edscorp.eds.speaker.domain.SpeakerStatusEntity;
import com.edscorp.eds.speaker.repository.BroadcastListRepository;
import com.edscorp.eds.speaker.repository.SpeakerListRepository;
import com.edscorp.eds.speaker.repository.SpeakerStatusRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@EnableAsync
public class SpeakerService {
    private final BroadcastListRepository broadcastListRepository;
    private final SpeakerListRepository speakerListRepository;
    private final SpeakerStatusRepository speakerDetailRepository;

    public List<SpeakerListEntity> getSpeakerList() {
        log.info("getSpeakerList : ", speakerListRepository.findAll());
        return speakerListRepository.findAll();
    }

    public List<SpeakerStatusEntity> getSpeakerDetail() {
        log.info("getSpeakerDetail : ", speakerDetailRepository.findAll());
        return speakerDetailRepository.findAll();
    }

    public List<SpeakerStatusEntity> getDetailsByCode(String locationCode, String speakerCode) {
        log.info("Service - locationCode: {}", locationCode);
        log.info("Service - speakerCode: {}", speakerCode);
        log.info("Service - getDetailsByCode : {}",
                speakerDetailRepository.findByLocationCodeAndSpeakerCode(locationCode, speakerCode));
        List<SpeakerStatusEntity> result = speakerDetailRepository.findByLocationCodeAndSpeakerCode(locationCode,
                speakerCode);
        ObjectMapper mapper = new ObjectMapper();
        try {
            log.info("Service - 조회 결과(JSON): {}", mapper.writeValueAsString(result));
        } catch (JsonProcessingException e) {
            log.error("JSON 직렬화 실패", e);
        }
        return result;
    }

    @Cacheable(value = "broadcastList")
    public List<BroadcastListEntity> getBroadcastList() {
        return broadcastListRepository.findAll();
    }

    @CacheEvict(value = "broadcastList", allEntries = true)
    public BroadcastListEntity add(BroadcastListEntity broadcastEntity) {
        return broadcastListRepository.save(broadcastEntity);
    }

    @CacheEvict(value = "broadcastList", allEntries = true)
    public BroadcastListEntity update(BroadcastListEntity broadcastEntity) {
        return broadcastListRepository.save(broadcastEntity);
    }

    @CacheEvict(value = "broadcastList", allEntries = true)
    public void delete(String code) {
        broadcastListRepository.deleteById(code);
    }

}
