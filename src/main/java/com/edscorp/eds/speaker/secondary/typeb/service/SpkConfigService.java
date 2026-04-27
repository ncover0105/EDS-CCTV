package com.edscorp.eds.speaker.secondary.typeb.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.speaker.secondary.dto.SpkConfigUpsertRequest;
import com.edscorp.eds.speaker.secondary.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.secondary.typeb.dto.SpeakerRowDto;
import com.edscorp.eds.speaker.secondary.typeb.repository.SpkConfigRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpkConfigService {

    private final SpkConfigRepository spkConfigRepository;

    private static final String NOT_DELETED = "00";
    private static final String DELETED = "01";

    public List<SpkConfig> getList() {
        return spkConfigRepository.findAll();
    }

    public List<SpeakerRowDto> getSpeakerRows() {
        return spkConfigRepository.findSpeakerRowsBySaveDivi("00");
    }

    public SpkConfig getSpeakerByKey(Integer key) {
        return spkConfigRepository.findById(key).orElse(null);
    }

    public SpkConfig getSpeakerById(String speakerId) {
        return spkConfigRepository.findBySpeakerId(speakerId);
    }

    public List<SpkConfig> getSpeakersByLocation(String locationCode) {
        return spkConfigRepository.findByLocationCode(locationCode);
    }

    public List<SpkConfig> getActiveSpeakers() {
        return spkConfigRepository.findBySaveDivi("00");
    }

    @Transactional
    public SpkConfig create(SpkConfigUpsertRequest req) {
        // 필수값 체크 (Validation 대신 직접)
        if (req.getSpeakerId() == null || req.getSpeakerId().isBlank()) {
            throw new IllegalArgumentException("speakerId는 필수입니다.");
        }

        // 중복 체크 (saveDivi=00 기준)
        if (spkConfigRepository.existsBySpeakerIdAndSaveDivi(req.getSpeakerId(), NOT_DELETED)) {
            throw new IllegalArgumentException("이미 존재하는 speakerId 입니다: " + req.getSpeakerId());
        }

        LocalDateTime now = LocalDateTime.now();

        SpkConfig e = SpkConfig.builder()
                .speakerId(req.getSpeakerId().trim())
                .orderGroupAutokey(req.getOrderGroupAutokey())
                .speakerName(req.getSpeakerName())
                .type(req.getType())
                .cdmaNumber(req.getCdmaNumber())
                .description(req.getDescription())
                .locationCode(req.getLocationCode())
                .locationName(req.getLocationName())
                .speakerAdr(req.getSpeakerAdr())
                .speakerLatitude(req.getSpeakerLatitude())
                .speakerLongitude(req.getSpeakerLongitude())
                .saveDivi(NOT_DELETED)
                .createTime(now)
                .updateTime(now)
                .build();

        return spkConfigRepository.save(e);
    }

    @Transactional
    public SpkConfig update(Integer speakerKey, SpkConfigUpsertRequest req) {
        SpkConfig e = spkConfigRepository.findBySpeakerKeyAndSaveDivi(speakerKey, NOT_DELETED)
                .orElseThrow(() -> new IllegalArgumentException("스피커를 찾을 수 없습니다: " + speakerKey));

        // speakerId는 보통 변경 불가로 운영 (원하면 아래 주석 해제 + 중복체크 추가)
        // if (req.getSpeakerId() != null && !req.getSpeakerId().isBlank())
        // e.setSpeakerId(req.getSpeakerId().trim());

        e.setOrderGroupAutokey(req.getOrderGroupAutokey());
        e.setSpeakerName(req.getSpeakerName());
        e.setType(req.getType());
        e.setCdmaNumber(req.getCdmaNumber());
        e.setDescription(req.getDescription());
        e.setLocationCode(req.getLocationCode());
        e.setLocationName(req.getLocationName());
        e.setSpeakerAdr(req.getSpeakerAdr());
        e.setSpeakerLatitude(req.getSpeakerLatitude());
        e.setSpeakerLongitude(req.getSpeakerLongitude());
        e.setUpdateTime(LocalDateTime.now());

        return spkConfigRepository.save(e);
    }

    @Transactional
    public void deleteSoft(Integer speakerKey, Integer userInfoAutokeyNullable) {
        SpkConfig e = spkConfigRepository.findBySpeakerKeyAndSaveDivi(speakerKey, NOT_DELETED)
                .orElseThrow(() -> new IllegalArgumentException("스피커를 찾을 수 없습니다: " + speakerKey));

        LocalDateTime now = LocalDateTime.now();

        e.setSaveDivi(DELETED);
        e.setDeleteTime(now);
        e.setUserInfoAutokey(userInfoAutokeyNullable);
        e.setUpdateTime(now);

        spkConfigRepository.save(e);
    }
}
