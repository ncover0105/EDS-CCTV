package com.edscorp.eds.speaker.secondary.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.secondary.domain.SpeakerSettingEntity;
import com.edscorp.eds.speaker.secondary.dto.SpeakerSettingDTO;
import com.edscorp.eds.speaker.secondary.repository.SpeakerSettingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SpeakerSettingService {

    private final SpeakerSettingRepository speakerSettingRepository;

    /** 단건 조회 (없으면 null 반환) */
    public SpeakerSettingDTO findBySpeakerKey(Integer speakerKey) {
        if (speakerKey == null)
            return null;

        return speakerSettingRepository.findById(speakerKey)
                .map(this::toDto)
                .orElse(null);
    }

    /** 전체 조회 */
    public List<SpeakerSettingDTO> findAll() {
        return speakerSettingRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /*
     * =========================
     * Entity -> DTO mapper
     * =========================
     */
    private SpeakerSettingDTO toDto(SpeakerSettingEntity e) {
        SpeakerSettingDTO d = new SpeakerSettingDTO();

        d.setSpeakerKey(e.getSpeakerKey());
        d.setReceiveTime(e.getReceiveTime());

        d.setBgmVolCh1(e.getBgmVolCh1());
        d.setBgmVolCh2(e.getBgmVolCh2());
        d.setBgmVolCh3(e.getBgmVolCh3());
        d.setBgmVolCh4(e.getBgmVolCh4());

        d.setAlertVolCh1(e.getAlertVolCh1());
        d.setAlertVolCh2(e.getAlertVolCh2());
        d.setAlertVolCh3(e.getAlertVolCh3());
        d.setAlertVolCh4(e.getAlertVolCh4());

        d.setFmVolCh1(e.getFmVolCh1());
        d.setFmVolCh2(e.getFmVolCh2());
        d.setFmVolCh3(e.getFmVolCh3());
        d.setFmVolCh4(e.getFmVolCh4());

        d.setUseCh1(e.getUseCh1());
        d.setUseCh2(e.getUseCh2());
        d.setUseCh3(e.getUseCh3());
        d.setUseCh4(e.getUseCh4());

        d.setTtaRegionCode(e.getTtaRegionCode());
        d.setDmbFrequency1(e.getDmbFrequency1());
        d.setDmbFrequency2(e.getDmbFrequency2());

        d.setServerip(e.getServerip());

        d.setBgmFolderNo(e.getBgmFolderNo());
        d.setBgmStatus(e.getBgmStatus());

        d.setBgmInVol(e.getBgmInVol());
        d.setStoInVol(e.getStoInVol());
        d.setTtsInVol(e.getTtsInVol());
        d.setFmInVol(e.getFmInVol());

        d.setTtsPitch(e.getTtsPitch());
        d.setTtsSpeed(e.getTtsSpeed());

        d.setPollingCheckTime(e.getPollingCheckTime());

        d.setMusicMode(e.getMusicMode());

        d.setRadioFrequency(e.getRadioFrequency());
        d.setRadioFrequencyRegion(e.getRadioFrequencyRegion());

        return d;
    }

    // // 전체 조회
    // public List<SpeakerSettingEntity> findAll() {
    // return speakerSettingRepository.findAll();
    // }

    // // 특정 스피커 조회
    // public SpeakerSettingEntity findSettingBySpeaker(String locationCode, String
    // speakerCode) {
    // SpeakerSettingId id = new SpeakerSettingId();

    // id.setLocationCode(locationCode);
    // id.setSpeakerCode(speakerCode);

    // return speakerSettingRepository.findById(id)
    // .orElse(null);
    // }

    // // 스피커 설정 저장
    // public SpeakerSettingEntity save(SpeakerSettingEntity entity) {
    // return speakerSettingRepository.save(entity);
    // }

}
