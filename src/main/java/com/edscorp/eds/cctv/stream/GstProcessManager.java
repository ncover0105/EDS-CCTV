package com.edscorp.eds.cctv.stream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class GstProcessManager {

    public record StartResult(boolean started, String reason) {
    }

    @Value("${gstreamer.api-base-url}")
    private String gstApiBaseUrl;

    @Value("${gstreamer.api-key:}")
    private String gstApiKey;

    // WSL2 단일 머신이면 기본 127.0.0.1 유지 권장
    @Value("${janus.host:127.0.0.1}")
    private String janusHost;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private final Map<String, Boolean> running = new ConcurrentHashMap<>();

    public boolean startEnsure(String key, String rtspUrl, int port, String type) {
        return startEnsureDetailed(key, rtspUrl, port, type).started();
    }

    public StartResult startEnsureDetailed(String key, String rtspUrl, int port, String type) {
        try {
            if (isAlive(key)) {
                stopAndWait(key, 8_000);
            }
        } catch (Exception ignore) {
        }
        return doStart(key, rtspUrl, port, type, 12_000);
    }

    /**
     * restart용: 호출자가 stop을 책임진다. (중복 STOP 방지)
     */
    public boolean startNoStop(String key, String rtspUrl, int port, String type) {
        return startNoStopDetailed(key, rtspUrl, port, type).started();
    }

    public StartResult startNoStopDetailed(String key, String rtspUrl, int port, String type) {
        return doStart(key, rtspUrl, port, type, 12_000);
    }

    private StartResult doStart(String key, String rtspUrl, int port, String type, long waitAliveMs) {
        Map<String, Object> body = Map.of(
                "id", key,
                "url", rtspUrl,
                "port", port,
                "type", type,
                "udpHost", janusHost);

        try {
            String resp = webClient.post()
                    .uri(gstApiBaseUrl + "/start")
                    .headers(this::applyAuth)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            running.put(key, true);

            boolean alive = waitUntilAlive(key, waitAliveMs);
            log.info("[{}] gstreamer started (alive={}): {}", key, alive, resp);
            if (!alive) {
                // start 호출은 성공했지만 status가 alive로 안 올라오면 "실패"로 취급
                running.remove(key);
                return new StartResult(false, "start accepted but pipeline not alive within timeout");
            }
            return new StartResult(true, null);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 409) {
                String errBody = e.getResponseBodyAsString();
                log.warn("[{}] /start returned 409 (already running or busy). body={}", key, errBody);

                // 1) status로 실제 alive면 성공 처리
                boolean aliveNow = false;
                try {
                    aliveNow = isAliveByStatus(key);
                } catch (Exception ignore) {
                }
                if (aliveNow) {
                    running.put(key, true);
                    log.info("[{}] treat 409 as success (confirmed alive by /status)", key);
                    return new StartResult(true, null);
                }

                // 2) 아니면 stop 후 1회 재시도
                stopAndWait(key, 8_000);
                try {
                    String resp2 = webClient.post()
                            .uri(gstApiBaseUrl + "/start")
                            .headers(this::applyAuth)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();

                    running.put(key, true);
                    boolean alive2 = waitUntilAlive(key, waitAliveMs);
                    log.info("[{}] gstreamer started after retry (alive={}): {}", key, alive2, resp2);
                    if (!alive2) {
                        running.remove(key);
                        return new StartResult(false, "start retry accepted but pipeline not alive within timeout");
                    }
                    return new StartResult(true, null);

                } catch (Exception e2) {
                    running.remove(key);
                    log.error("[{}] retry start failed after 409", key, e2);
                    return new StartResult(false, "start retry failed after 409: " + e2.getMessage());
                }
            }

            running.remove(key);
            log.error("[{}] gstreamer start failed. status={} body={}",
                    key,
                    e.getStatusCode().value(), // ✅ 대체 방식
                    e.getResponseBodyAsString(),
                    e);
            return new StartResult(false,
                    "gstreamer start failed. status=" + e.getStatusCode().value() + ", body=" + e.getResponseBodyAsString());
        } catch (Exception e) {
            running.remove(key);
            log.error("[{}] gstreamer start failed", key, e);
            return new StartResult(false, "gstreamer start failed: " + e.getMessage());
        }
    }

    public boolean stop(String key) {
        try {
            String resp = webClient.delete()
                    .uri(gstApiBaseUrl + "/stop/" + key)
                    .headers(this::applyAuth)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .onErrorReturn("")
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

    /**
     * STOP 요청 후 /status 가 내려갈 때까지 대기
     * - "stopping" 상태에서 바로 start하면 레이스로 새 프로세스가 죽을 수 있음
     */
    public void stopAndWait(String key, long maxWaitMs) {
        stop(key);

        long deadline = System.currentTimeMillis() + maxWaitMs;
        while (System.currentTimeMillis() < deadline) {
            boolean alive = false;
            try {
                alive = isAliveByStatus(key);
            } catch (Exception ignore) {
            }

            if (!alive)
                return;

            try {
                Thread.sleep(150);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        log.warn("[{}] stopAndWait timeout; proceeding anyway", key);
    }

    public boolean isAlive(String key) {
        try {
            boolean statusAlive = isAliveByStatus(key);
            // status API 결과와 running 맵 동기화
            if (statusAlive) {
                running.put(key, true);
            } else {
                running.remove(key);
            }
            return statusAlive;
        } catch (Exception e) {
            // status API 실패 시 running 맵 fallback
            return running.getOrDefault(key, false);
        }
    }

    private boolean waitUntilAlive(String key, long maxWaitMs) {
        long deadline = System.currentTimeMillis() + maxWaitMs;

        while (System.currentTimeMillis() < deadline) {
            try {
                if (isAliveByStatus(key))
                    return true;
            } catch (Exception ignore) {
            }

            try {
                Thread.sleep(150);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    private boolean isAliveByStatus(String key) {
        String resp = webClient.get()
                .uri(gstApiBaseUrl + "/status/" + key)
                .headers(this::applyAuth)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(2))
                .onErrorReturn("")
                .block();

        return parseAlive(resp);
    }

    public boolean isServerReachable() {
        try {
            String resp = webClient.get()
                    .uri(gstApiBaseUrl + "/healthz")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(2))
                    .onErrorReturn("")
                    .block();
            return resp != null && resp.contains("\"ok\":true");
        } catch (Exception e) {
            log.warn("GST 서버 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * /status 응답 포맷이 뭐든 최대한 안전하게 살아있음을 판정
     * 지원 예:
     * - true / false
     * - {"alive":true}
     * - {"running":true}
     * - {"status":"running"} / {"status":"started"} / {"status":"ok"}
     */
    private boolean parseAlive(String resp) {
        if (resp == null)
            return false;
        String s = resp.trim();
        if (s.isEmpty())
            return false;

        // 단순 boolean
        if ("true".equalsIgnoreCase(s))
            return true;
        if ("false".equalsIgnoreCase(s))
            return false;

        // JSON 파싱
        try {
            JsonNode node = objectMapper.readTree(s);

            // {"alive":true} / {"running":true}
            if (node.has("alive") && node.get("alive").isBoolean())
                return node.get("alive").asBoolean();
            if (node.has("running") && node.get("running").isBoolean())
                return node.get("running").asBoolean();

            // {"status":"running|started|ok|up"}
            if (node.has("status")) {
                String st = node.get("status").asText("").toLowerCase();
                if (st.contains("run") || st.contains("start") || st.contains("ok") || st.contains("up"))
                    return true;
                if (st.contains("stop") || st.contains("down") || st.contains("dead"))
                    return false;
            }

            // {"data":{"alive":true}} 같은 구조도 커버
            JsonNode data = node.path("data");
            if (!data.isMissingNode()) {
                if (data.has("alive") && data.get("alive").isBoolean())
                    return data.get("alive").asBoolean();
                if (data.has("running") && data.get("running").isBoolean())
                    return data.get("running").asBoolean();
                if (data.has("status")) {
                    String st = data.get("status").asText("").toLowerCase();
                    if (st.contains("run") || st.contains("start") || st.contains("ok") || st.contains("up"))
                        return true;
                }
            }

        } catch (Exception ignore) {
            // JSON이 아니면 아래 fallback으로
        }

        // 문자열 fallback (마지막 보험)
        String low = s.toLowerCase();
        if (low.contains("\"alive\":true") || low.contains("\"running\":true"))
            return true;
        if (low.contains("running") || low.contains("started") || low.contains("ok"))
            return true;

        return false;
    }

    private void applyAuth(HttpHeaders headers) {
        if (gstApiKey != null && !gstApiKey.isBlank()) {
            headers.set("x-api-key", gstApiKey);
        }
    }

}
