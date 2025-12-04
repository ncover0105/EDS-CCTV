package com.edscorp.eds.speaker.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.dto.BTypeActionRequest;
import com.edscorp.eds.speaker.dto.BTypeAlertRequest;
import com.edscorp.eds.speaker.service.BTypeCommandService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype")
public class BTypeController {

    private final BTypeCommandService bTypeCommandService;

    /**
     * B 타입 발령 (재난/방송)
     * 기존 JS sendAlert 포팅
     */
    @PostMapping("/alert")
    public ResponseEntity<String> sendAlert(@RequestBody BTypeAlertRequest req,
            HttpServletRequest httpReq) throws Exception {
        bTypeCommandService.sendAlert(req, httpReq);
        return ResponseEntity.ok("B-Type Alert command sent.");
    }

    /**
     * B 타입 스피커 제어
     * 기존 JS handleSpeakerAction 포팅
     */
    @PostMapping("/control")
    public ResponseEntity<String> control(@RequestBody BTypeActionRequest req,
            HttpServletRequest httpReq) {
        bTypeCommandService.handleSpeakerAction(req, httpReq);
        return ResponseEntity.ok("B-Type control command sent.");
    }
}
