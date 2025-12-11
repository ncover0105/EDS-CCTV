package com.edscorp.eds.speaker.typeb.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkTestResultEntity;
import com.edscorp.eds.speaker.typeb.repository.SpkTestResultRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SpkTestResultService {

    private final SpkTestResultRepository spkTestResultRepository;

    public List<SpkTestResultEntity> getTestResults(Integer speakerKey) {
        return spkTestResultRepository.findBySpeakerInfoAutokey(speakerKey);
    }

    public SpkTestResultEntity saveTestResult(SpkTestResultEntity entity) {
        return spkTestResultRepository.save(entity);
    }

}
