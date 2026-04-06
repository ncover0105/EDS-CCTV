package com.edscorp.eds.speaker.typeb.controller;

import java.util.HashMap;
import java.util.Map;

import java.util.List;
import java.util.Objects;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.dto.BTypeActionRequest;
import com.edscorp.eds.speaker.typeb.dto.BTypeAlertRequest;
import com.edscorp.eds.speaker.typeb.service.BTypeCommandService;
import com.edscorp.eds.speaker.typeb.service.SpkSystemConfigService;
import com.edscorp.eds.speaker.typeb.domain.SpkSystemConfigEntity;
import com.edscorp.eds.common.util.Sha256Util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype/command")
public class BtypeCommandController {

    private final BTypeCommandService bTypeCommandService;
    private final SpkSystemConfigService spkSystemConfigService;

    // B 타입 발령 (재난/방송)
    @PostMapping("/alert")
    public ResponseEntity<Map<String, Object>> sendAlert(@RequestBody BTypeAlertRequest req,
            HttpServletRequest httpReq) {
        ResponseEntity<Map<String, Object>> passwordError = validatePassword(req.getPassword());
        if (passwordError != null) {
            return passwordError;
        }
        try {
            bTypeCommandService.sendAlert(req, httpReq);
            return ResponseEntity.ok(Map.of("ok", true, "message", "B-Type Alert command sent."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "ok", false,
                    "message", "발령 도중 오류 발생: " + e.getMessage()));
        }
    }

    // B 타입 스피커 제어
    @PostMapping("/control")
    public ResponseEntity<Map<String, Object>> control(@RequestBody BTypeActionRequest req,
            HttpServletRequest httpReq) {
        ResponseEntity<Map<String, Object>> passwordError = validatePassword(req.getPassword());
        if (passwordError != null) {
            return passwordError;
        }
        try {
            List<String> responses = bTypeCommandService.handleSpeakerAction(req, httpReq);
            return ResponseEntity
                    .ok(Map.of("ok", true, "message", "B-Type control command sent.", "responses", responses));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "ok", false,
                    "message", "제어 도중 오류 발생: " + e.getMessage()));
        }
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
        ResponseEntity<Map<String, Object>> passwordError = validatePassword(req.getPassword());
        if (passwordError != null) {
            return passwordError;
        }

        // 서비스 호출
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> responses = bTypeCommandService.handleSpeakerAction(req, httpReq);
            result.put("responses", responses);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "ok", false,
                    "message", e.getMessage()));
        }

        // 프론트에서 json을 기대하므로 ok 응답 제공
        result.put("ok", true);
        result.put("message", "sent");
        result.put("action", req.getAction());
        result.put("speakerCount", req.getSpeakerIds().size());

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<Map<String, Object>> validatePassword(String inputPassword) {
        String configuredPassword = resolveConfiguredPassword();

        if (configuredPassword == null || configuredPassword.isBlank()) {
            return ResponseEntity.status(500).body(Map.of(
                    "ok", false,
                    "message", "스피커 제어 비밀번호 설정을 찾을 수 없습니다."));
        }

        if (inputPassword == null || inputPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "비밀번호를 입력하세요."));
        }

        String hashedInputPassword = Sha256Util.sha256Hex(inputPassword);
        if (!configuredPassword.equalsIgnoreCase(hashedInputPassword)) {
            return ResponseEntity.status(401).body(Map.of(
                    "ok", false,
                    "message", "비밀번호가 틀렸습니다."));
        }

        return null;
    }

    private String resolveConfiguredPassword() {
        List<String> candidateKeys = List.of(
                "speaker_password",
                "spk_password",
                "password");

        for (String key : candidateKeys) {
            SpkSystemConfigEntity config = spkSystemConfigService.getConfig(key);
            if (config != null && config.getConfigValue() != null && !config.getConfigValue().isBlank()) {
                return config.getConfigValue();
            }
        }

        return spkSystemConfigService.getAllConfigs().stream()
                .filter(Objects::nonNull)
                .filter(config -> "password".equalsIgnoreCase(String.valueOf(config.getConfigType()).trim()))
                .map(SpkSystemConfigEntity::getConfigValue)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .findFirst()
                .orElse(null);
    }
}
