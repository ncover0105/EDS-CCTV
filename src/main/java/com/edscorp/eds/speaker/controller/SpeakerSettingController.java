package com.edscorp.eds.speaker.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.domain.SpeakerSettingEntity;
import com.edscorp.eds.speaker.dto.SpeakerActionRequest;
import com.edscorp.eds.speaker.dto.SpeakerSettingDTO;
import com.edscorp.eds.speaker.service.SpeakerSettingService;
import com.edscorp.eds.speaker.typeb.dto.BTypeActionRequest;
import com.edscorp.eds.speaker.typeb.service.BTypeCommandService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/spk")
public class SpeakerSettingController {
    private final SpeakerSettingService speakerSettingService;
    private final BTypeCommandService bTypeCommandService;

    @GetMapping("/{speakerKey}/setting")
    public ResponseEntity<SpeakerSettingDTO> getOne(@PathVariable("speakerKey") Integer speakerKey) {
        SpeakerSettingDTO dto = speakerSettingService.findBySpeakerKey(speakerKey);
        if (dto == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/setting")
    public List<SpeakerSettingDTO> getAll() {
        return speakerSettingService.findAll();
    }

    @PostMapping("/action")
    public ResponseEntity<Void> handleSpeakerAction(
            @RequestBody BTypeActionRequest req,
            HttpServletRequest request) {

        bTypeCommandService.handleSpeakerAction(req, request);
        return ResponseEntity.ok().build();
    }

    // // 전체 스피커 설정
    // @GetMapping
    // public List<SpeakerSettingEntity> getAll() {
    // return speakerSettingService.findAll();
    // }

    // // 개별 스피커 설정
    // @GetMapping("/{locationCode}/{speakerCode}")
    // public SpeakerSettingEntity getSpeakerSetting(
    // @PathVariable("locationCode") String locationCode,
    // @PathVariable("speakerCode") String speakerCode) {
    // return speakerSettingService.findSettingBySpeaker(locationCode, speakerCode);
    // }

    // @PostMapping
    // public SpeakerSettingEntity save(@RequestBody SpeakerSettingEntity entity) {
    // return speakerSettingService.save(entity);
    // }

}
