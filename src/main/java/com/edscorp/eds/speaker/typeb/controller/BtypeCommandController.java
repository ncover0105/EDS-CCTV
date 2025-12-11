package com.edscorp.eds.speaker.typeb.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.dto.BTypeActionRequest;
import com.edscorp.eds.speaker.typeb.dto.BTypeAlertRequest;
import com.edscorp.eds.speaker.typeb.service.BTypeCommandService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype/command")
public class BtypeCommandController {

    private final BTypeCommandService bTypeCommandService;

    // B 타입 발령 (재난/방송)
    @PostMapping("/alert")
    public ResponseEntity<String> sendAlert(@RequestBody BTypeAlertRequest req,
            HttpServletRequest httpReq) throws Exception {
        bTypeCommandService.sendAlert(req, httpReq);
        return ResponseEntity.ok("B-Type Alert command sent.");
    }

    // B 타입 스피커 제어
    @PostMapping("/control")
    public ResponseEntity<String> control(@RequestBody BTypeActionRequest req,
            HttpServletRequest httpReq) {
        bTypeCommandService.handleSpeakerAction(req, httpReq);
        return ResponseEntity.ok("B-Type control command sent.");
    }
}
