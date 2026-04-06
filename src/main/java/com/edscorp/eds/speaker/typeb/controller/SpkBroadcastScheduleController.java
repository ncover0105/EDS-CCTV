package com.edscorp.eds.speaker.typeb.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.dto.ScheduleSaveRequest;
import com.edscorp.eds.speaker.typeb.dto.SpkBroadcastScheduleViewDto;
import com.edscorp.eds.speaker.typeb.service.SpkBroadcastScheduleService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype/schedule")
public class SpkBroadcastScheduleController {
    private final SpkBroadcastScheduleService scheduleService;

    @GetMapping("/list")
    public List<SpkBroadcastScheduleViewDto> list() {
        return scheduleService.listSchedules();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ScheduleSaveRequest req) {
        return ResponseEntity.ok(scheduleService.saveSchedule(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, @RequestBody ScheduleSaveRequest req) {
        return ResponseEntity.ok(scheduleService.updateSchedule(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok().build();
    }

}
