package com.edscorp.eds.speaker.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.domain.BroadcastScheduleEntity;
import com.edscorp.eds.speaker.domain.ScheduleSpeaker;
import com.edscorp.eds.speaker.service.BroadcastScheduleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedule")
@Slf4j
public class BroadcastScheduleController {

    private final BroadcastScheduleService broadcastScheduleService;

    // 스케줄 등록
    @PostMapping
    public BroadcastScheduleEntity create(@RequestBody BroadcastScheduleEntity schedule) {
        log.info("createSchedule - schedule: {}", schedule);
        return broadcastScheduleService.createSchedule(schedule);
    }

    // 스케줄 수정
    @PutMapping("/{id}")
    public BroadcastScheduleEntity update(@PathVariable Long id, @RequestBody BroadcastScheduleEntity schedule) {
        return broadcastScheduleService.updateSchedule(id, schedule);
    }

    // 스케줄 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        broadcastScheduleService.deleteSchedule(id);
    }

    // 스케줄별 스피커 추가
    @PostMapping("/{scheduleId}/speaker")
    public void addSpeaker(@PathVariable Long scheduleId, @RequestBody ScheduleSpeaker speaker) {
        broadcastScheduleService.addSpeakerToSchedule(scheduleId, speaker);
    }

    // 스케줄별 스피커 삭제
    @DeleteMapping("/{scheduleId}/speaker/{mappingId}")
    public void removeSpeaker(@PathVariable Long scheduleId, @PathVariable Long mappingId) {
        broadcastScheduleService.removeSpeakerFromSchedule(scheduleId, mappingId);
    }

    // 스케줄별 스피커 목록
    @GetMapping("/{scheduleId}/speakers")
    public List<ScheduleSpeaker> getSpeakers(@PathVariable Long scheduleId) {
        return broadcastScheduleService.getSpeakersBySchedule(scheduleId);
    }

}
