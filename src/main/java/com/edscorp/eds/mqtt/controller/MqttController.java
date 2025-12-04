package com.edscorp.eds.mqtt.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.edscorp.eds.mqtt.domain.EmergencyEntity;
import com.edscorp.eds.mqtt.dto.MqttMessageEvent;
import com.edscorp.eds.mqtt.repository.AlertListRepository;
import com.edscorp.eds.mqtt.repository.EmergencyRepository;
import com.edscorp.eds.mqtt.service.MqttService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@Slf4j
@RequiredArgsConstructor
@RequestMapping(value = "/api")
public class MqttController {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final ApplicationEventPublisher eventPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmergencyRepository emergencyRepository;
    private final AlertListRepository alertListRepository;
    private final MqttService mqttService;

    // 실시간 메시지를 받기 위한 엔드포인트
    @GetMapping("/events")
    public SseEmitter getMessages() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter)); // 에러 발생 시 제거

        return emitter;
    }

    // MQTT 메시지가 수신될 때마다 클라이언트로 전송
    @Async
    @EventListener
    public void onMessageReceived(MqttMessageEvent event) {
        System.out.println("onMessageReceived message: " + event.getTopic() + " - " + event.getMessage());

        // update(+) : emitter 오류 대응
        Map<String, String> jsonData = new HashMap<>();
        jsonData.put("topic", event.getTopic());
        jsonData.put("message", event.getMessage());

        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(jsonData); // JSON 변환
        } catch (Exception e) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(jsonString));
            } catch (IOException e) {
                emitter.completeWithError(e);
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters); // 예외 발생한 emitter들을 한 번에 제거
    }

    @GetMapping("/log")
    @ResponseBody
    public List<EmergencyEntity> getTodayLogs(
            @RequestParam(name = "alertCode", defaultValue = "003") String alertCode) {
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime startOfDay = today.atStartOfDay();
            LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
            log.info("getTodayLogs alertCode = " + alertCode);
            List<EmergencyEntity> result = emergencyRepository.findTodayLogsByAlertCode(alertCode, startOfDay,
                    startOfNextDay);

            return result;
        } catch (Exception e) {
            log.error("getTodayLogs 에러 발생: ", e);
            throw e;
        }

    }

    @GetMapping("/alerts")
    public ResponseEntity<Map<String, String>> getAllAlertMessages() {
        return ResponseEntity.ok(mqttService.getAllAlertMessages());
    }

    @GetMapping("/alert/{alertCode}")
    public ResponseEntity<String> getAlertMessage(@PathVariable String alertCode) {
        return ResponseEntity.ok(mqttService.getMessageBtAlertCode(alertCode));
    }

}
