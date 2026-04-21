package com.edscorp.eds.mqtt.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
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

    // [fix] Nginx proxy_read_timeout(60s) 보다 짧게 설정해 프록시가 먼저 끊는 상황을 방지.
    //       클라이언트는 onerror → 자동 재연결로 처리하므로 서버 측 변경만으로 충분.
    private static final long SSE_TIMEOUT_MS = 45_000L;

    // [fix] 무제한 연결 누적을 방지하는 상한선.
    //       초과 시 즉시 complete() 반환 → 클라이언트 onerror → 지수 백오프 재연결.
    private static final int MAX_EMITTERS = 50;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final ApplicationEventPublisher eventPublisher;

    // [fix] new ObjectMapper() 직접 생성 제거 → Spring 빈 주입.
    //       직접 생성 시 JavaTimeModule 등 Spring이 등록하는 모듈이 적용되지 않아
    //       LocalDateTime 등 직렬화가 깨질 수 있음.
    private final ObjectMapper objectMapper;
    private final EmergencyRepository emergencyRepository;
    private final AlertListRepository alertListRepository;
    private final MqttService mqttService;

    // 실시간 메시지를 받기 위한 엔드포인트
    @GetMapping("/events")
    public SseEmitter getMessages() {
        // [fix] 연결 수 상한 초과 시 즉시 완료 처리.
        if (emitters.size() >= MAX_EMITTERS) {
            log.warn("SSE 연결 수 상한 초과 ({}). 신규 연결 거부.", MAX_EMITTERS);
            SseEmitter rejected = new SseEmitter(0L);
            rejected.complete();
            return rejected;
        }

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        return emitter;
    }

    // [fix] Heartbeat 전송으로 Nginx idle 타임아웃 및 Phantom Emitter를 주기적으로 정리.
    //       SSE 스펙의 comment 라인(:)을 사용하므로 클라이언트 onmessage는 호출되지 않음.
    //       @EnableScheduling은 EdsApplication에 이미 선언되어 있음.
    @Scheduled(fixedDelay = 30_000)
    public void sendHeartbeat() {
        if (emitters.isEmpty()) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException e) {
                // send 실패 = 이미 끊어진 연결. onError가 호출되어 emitters에서 제거됨.
                emitters.remove(emitter);
            }
        }
    }

    // MQTT 메시지가 수신될 때마다 클라이언트로 전송
    @Async
    @EventListener
    public void onMessageReceived(MqttMessageEvent event) {
        log.debug("SSE 전송 - topic: {}, message: {}", event.getTopic(), event.getMessage());

        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(
                    Map.of("topic", event.getTopic(), "message", event.getMessage()));
        } catch (Exception e) {
            log.error("SSE 페이로드 직렬화 실패 - topic: {}", event.getTopic(), e);
            return;
        }

        // [fix] completeWithError() + deadEmitters 이중 제거 패턴 제거.
        //       completeWithError()는 onError 콜백을 즉시 호출해 emitters.remove()가
        //       먼저 실행되므로 이후 removeAll은 이중 처리가 됨.
        //       send 실패 시 직접 remove하는 것으로 단순화.
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(jsonString));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    @GetMapping("/log")
    @ResponseBody
    public List<EmergencyEntity> getTodayLogs(
            @RequestParam(name = "alertCode", defaultValue = "003") String alertCode) {
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime startOfDay = today.atStartOfDay();
            LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
            log.info("getTodayLogs alertCode={}", alertCode);
            return emergencyRepository.findTodayLogsByAlertCode(alertCode, startOfDay, startOfNextDay);
        } catch (Exception e) {
            log.error("getTodayLogs 에러 발생", e);
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
