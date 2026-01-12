package com.edscorp.eds.speaker.typeb.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.dto.SpkBroadcastScheduleViewDto;
import com.edscorp.eds.speaker.typeb.service.SpkBroadcastScheduleService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype/schedule")
public class SpkBroadcastScheduleController {
    private final SpkBroadcastScheduleService scheduleService;

    @GetMapping("/list")
    public List<SpkBroadcastScheduleViewDto> list() {
        return scheduleService.listSchedules();
    }

}
