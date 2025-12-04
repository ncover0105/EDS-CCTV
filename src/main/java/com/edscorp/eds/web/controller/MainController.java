package com.edscorp.eds.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.edscorp.eds.cctv.service.CameraCache;
import com.edscorp.eds.cctv.service.CctvService;
import com.edscorp.eds.common.domain.SystemSetting;
import com.edscorp.eds.speaker.service.SpeakerService;
import com.edscorp.eds.weather.service.WeatherService;
import com.edscorp.eds.web.service.SystemSettingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MainController {

    private final WeatherService weatherService;
    private final CameraCache cameraCache;
    // private final JanusManager janusManager;
    private final CctvService cctvService;
    private final SystemSettingService systemSettingService;
    private final SpeakerService speakerService;

    @GetMapping("/main")
    public String showMainPage(Model model) {
        log.info("MainController : " + cameraCache.getCameras());

        SystemSetting systemSetting = systemSettingService.getSetting();

        model.addAttribute("title", "EDS-Home");
        model.addAttribute("cameras", cameraCache.getCameras());
        model.addAttribute("currentPage", "main");
        model.addAttribute("mapApiKey", systemSetting.getMapApiKey());
        // model.addAttribute("speakerList", speakerService.getSpeakerList());

        return "page/homePage";
    }

    // @PostMapping("/start/{code}")
    // public ResponseEntity<String> start(@PathVariable String code) {
    // try {
    // cctvService.start(code);
    // return ResponseEntity.ok("Started");
    // } catch (Exception e) {
    // return ResponseEntity.status(500).body(e.getMessage());
    // }
    // }

    // @PostMapping("/stop/{code}")
    // public ResponseEntity<String> stop(@PathVariable String code) {
    // try {
    // cctvService.stop(code);
    // return ResponseEntity.ok("Stopped");
    // } catch (Exception e) {
    // return ResponseEntity.status(500).body(e.getMessage());
    // }
    // }

    // @PostMapping("/{cctvCode}/start")
    // public ResponseEntity<Map<String, Object>> start(@PathVariable String
    // cctvCode) {
    // try {
    // cctvService.start(cctvCode);
    // return ResponseEntity.ok(Map.of("cctvCode", cctvCode, "status", "started"));
    // } catch (IOException e) {
    // return ResponseEntity.status(500).body(Map.of("cctvCode", cctvCode, "status",
    // "error", "message", e.getMessage()));
    // }
    // }

    // @PostMapping("/{cctvCode}/stop")
    // public ResponseEntity<Map<String, Object>> stop(@PathVariable String
    // cctvCode) {
    // try {
    // cctvService.stop(cctvCode);
    // return ResponseEntity.ok(Map.of("cctvCode", cctvCode, "status", "stopped"));
    // } catch (Exception e) {
    // return ResponseEntity.status(500).body(Map.of("cctvCode", cctvCode, "status",
    // "error", "message", e.getMessage()));
    // }
    // }

    // @GetMapping("/{cctvCode}/status")
    // public ResponseEntity<Map<String, Object>> status(@PathVariable String
    // cctvCode) {
    // boolean running = cctvService.isRunning(cctvCode);
    // return ResponseEntity.ok(Map.of("cctvCode", cctvCode, "running", running));
    // }

    @GetMapping("/api/settings")
    public ResponseEntity<SystemSetting> getSettings() {
        return ResponseEntity.ok(systemSettingService.getSetting());
    }

    @PostMapping("/api/settings")
    public ResponseEntity<?> updateSettings(@RequestBody SystemSetting incoming) {
        try {
            // 안전장치: null 체크
            if (incoming == null) {
                return ResponseEntity.badRequest().body("유효하지 않은 요청 (body가 비어있음).");
            }

            // 간단 유효성 검사
            int mode = incoming.getMode();
            if (mode != 0 && mode != 1) {
                return ResponseEntity.badRequest().body("mode는 0(실제) 또는 1(시험)만 허용됩니다.");
            }

            String media = incoming.getMedia();
            if (media == null || (!"cable".equals(media) && !"dmb".equals(media))) {
                return ResponseEntity.badRequest().body("media는 'cable' 또는 'dmb'만 허용됩니다.");
            }

            String type = incoming.getType();
            if (type == null || (!"tts".equals(type) && !"saved".equals(type))) {
                return ResponseEntity.badRequest().body("type은 'tts' 또는 'saved'만 허용됩니다.");
            }

            // id 강제 고정 (단일 row 정책)
            incoming.setId(1L);

            SystemSetting saved = systemSettingService.updateSetting(incoming);
            log.info("System setting updated: {}", saved);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Failed to update system settings", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("설정 저장 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
