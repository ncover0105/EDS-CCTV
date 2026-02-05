package com.edscorp.eds.cctv.stream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class GstProcessManager {

    @Value("${gstreamer.api-base-url}")
    private String gstApiBaseUrl;

    @Value("${gstreamer.api-key:}")
    private String gstApiKey;

    // WSL2 단일 머신이면 기본 127.0.0.1 유지 권장
    @Value("${janus.host:127.0.0.1}")
    private String janusHost;

    private final WebClient webClient;

    private final Map<String, Boolean> running = new ConcurrentHashMap<>();

    public boolean start(String key, String rtspUrl, int port, String type) {
        // stop은 "시도"만. 실패하더라도 start 진행.
        stop(key);

        Map<String, Object> body = Map.of(
                "id", key,
                "url", rtspUrl,
                "port", port,
                "type", type,
                "udpHost", janusHost);

        try {
            String resp = webClient.post()
                    .uri(gstApiBaseUrl + "/start")
                    .headers(h -> applyAuth(h))
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            running.put(key, true);
            log.info("[{}] gstreamer started: {}", key, resp);
            return true;
        } catch (Exception e) {
            running.remove(key);
            log.error("[{}] gstreamer start failed", key, e);
            return false;
        }
    }

    public boolean stop(String key) {
        try {
            String resp = webClient.delete()
                    .uri(gstApiBaseUrl + "/stop/" + key)
                    .headers(h -> applyAuth(h))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .onErrorReturn("") // 404/네트워크 등은 정책상 무시 가능
                    .block();

            running.remove(key);
            log.info("[{}] gstreamer stop requested: {}", key, resp);
            return true;
        } catch (Exception e) {
            running.remove(key);
            log.warn("[{}] gstreamer stop error", key, e);
            return false;
        }
    }

    public boolean isRunning(String key) {
        return running.getOrDefault(key, false);
    }

    private void applyAuth(HttpHeaders headers) {
        if (gstApiKey != null && !gstApiKey.isBlank()) {
            headers.set("x-api-key", gstApiKey);
        }
    }

    public boolean isAlive(String key) {
        if (!isRunning(key))
            return false;

        try {
            String resp = webClient.get()
                    .uri(gstApiBaseUrl + "/status/" + key)
                    .headers(h -> applyAuth(h))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(2))
                    .block();
            return resp != null && resp.contains("true");
        } catch (Exception ignore) {
            return isRunning(key);
        }
    }

}