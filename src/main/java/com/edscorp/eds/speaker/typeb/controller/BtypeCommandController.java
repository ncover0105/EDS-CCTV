package com.edscorp.eds.speaker.typeb.controller;

import java.util.HashMap;
import java.util.Map;

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

    // 스피커 상태 발신
    @PostMapping("/action")
    public ResponseEntity<Map<String, Object>> action(
            @RequestBody BTypeActionRequest req,
            HttpServletRequest httpReq) {
        if (req == null || req.getSpeakerIds() == null || req.getSpeakerIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "speakerIds가 비어있습니다."));
        }
        if (req.getAction() == null || req.getAction().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "action이 비어있습니다."));
        }

        // 서비스 호출
        bTypeCommandService.handleSpeakerAction(req, httpReq);

        // 프론트에서 json을 기대하므로 ok 응답 제공
        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("message", "sent");
        result.put("action", req.getAction());
        result.put("speakerCount", req.getSpeakerIds().size());

        return ResponseEntity.ok(result);
    }
}
