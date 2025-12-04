package com.edscorp.eds.speaker.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.domain.BroadcastScheduleEntity;
import com.edscorp.eds.speaker.domain.ScheduleSpeaker;
import com.edscorp.eds.speaker.dto.ScheduleDetailDTO;
import com.edscorp.eds.speaker.repository.BroadcastScheduleRepository;
import com.edscorp.eds.speaker.repository.ScheduleSpeakerRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BroadcastScheduleService {

    private final BroadcastScheduleRepository broadcastScheduleRepository;
    private final ScheduleSpeakerRepository scheduleSpeakerRepository;

    @Transactional
    public List<BroadcastScheduleEntity> getAllSchedules() {
        return broadcastScheduleRepository.findAll();
    }

    // public BroadcastScheduleEntity updateSchedule(Long id,
    // BroadcastScheduleEntity updated) {
    // log.info("updateSchedule - id: {}, updated: {}", id, updated);

    // BroadcastScheduleEntity entity = broadcastScheduleRepository.findById(id)
    // .orElseThrow(() -> new IllegalArgumentException("해당 스케줄이 존재하지
    // 않습니다."));

    // entity.setScheduleName(updated.getScheduleName());
    // entity.setStartTime(updated.getStartTime());
    // entity.setEndTime(updated.getEndTime());
    // entity.setPlayType(updated.getPlayType());
    // entity.setFolderName(updated.getFolderName());
    // entity.setRepeatEnabled(updated.getRepeatEnabled());
    // entity.setSun(updated.getSun());
    // entity.setMon(updated.getMon());
    // entity.setTue(updated.getTue());
    // entity.setWed(updated.getWed());
    // entity.setThu(updated.getThu());
    // entity.setFri(updated.getFri());
    // entity.setSat(updated.getSat());

    // return broadcastScheduleRepository.save(entity);
    // }

    // 스케줄 반환 타입 수정
    public List<ScheduleDetailDTO> getAllScheduleSpeakers() {
        log.info("getAllScheduleSpeakers 실행");
        return broadcastScheduleRepository.findAllSchedulesWithSpeakers();
    }

    // 특정 스케줄 조회 추가
    public List<ScheduleDetailDTO> getScheduleWithSpeakers(Long scheduleId) {
        log.info("getScheduleWithSpeakers - scheduleId: {}", scheduleId);
        return broadcastScheduleRepository.findScheduleWithSpeakers(scheduleId);
    }

    public BroadcastScheduleEntity createSchedule(BroadcastScheduleEntity schedule) {
        return broadcastScheduleRepository.save(schedule);
    }

    public BroadcastScheduleEntity updateSchedule(Long scheduleId, BroadcastScheduleEntity updated) {
        BroadcastScheduleEntity entity = broadcastScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다. ID=" + scheduleId));
        entity.setScheduleName(updated.getScheduleName());
        entity.setStartTime(updated.getStartTime());
        entity.setEndTime(updated.getEndTime());
        entity.setPlayType(updated.getPlayType());
        entity.setFolderName(updated.getFolderName());
        entity.setRepeatEnabled(updated.getRepeatEnabled());
        entity.setSun(updated.getSun());
        entity.setMon(updated.getMon());
        entity.setTue(updated.getTue());
        entity.setWed(updated.getWed());
        entity.setThu(updated.getThu());
        entity.setFri(updated.getFri());
        entity.setSat(updated.getSat());

        return broadcastScheduleRepository.save(entity);
    }

    public void deleteSchedule(Long scheduleId) {
        if (!broadcastScheduleRepository.existsById(scheduleId)) {
            throw new IllegalArgumentException("삭제할 스케줄이 존재하지 않습니다. ID=" + scheduleId);
        }
        broadcastScheduleRepository.deleteById(scheduleId);
    }

    public void addSpeakerToSchedule(Long scheduleId, ScheduleSpeaker scheduleSpeaker) {
        BroadcastScheduleEntity schedule = broadcastScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다. ID=" + scheduleId));

        // 관계 설정
        scheduleSpeaker.setSchedule(schedule);

        // 저장
        scheduleSpeakerRepository.save(scheduleSpeaker);
    }

    public void removeSpeakerFromSchedule(Long scheduleId, Long mappingId) {
        ScheduleSpeaker speakerMapping = scheduleSpeakerRepository.findById(mappingId)
                .orElseThrow(() -> new IllegalArgumentException("스피커 매핑을 찾을 수 없습니다. ID=" + mappingId));

        // 스케줄 ID 일치 여부 검증
        if (!speakerMapping.getSchedule().getScheduleId().equals(scheduleId)) {
            throw new IllegalStateException("스케줄 ID와 매핑 ID가 일치하지 않습니다.");
        }

        scheduleSpeakerRepository.delete(speakerMapping);
    }

    @Transactional
    public List<ScheduleSpeaker> getSpeakersBySchedule(Long scheduleId) {
        return scheduleSpeakerRepository.findByScheduleScheduleId(scheduleId);
    }

}
