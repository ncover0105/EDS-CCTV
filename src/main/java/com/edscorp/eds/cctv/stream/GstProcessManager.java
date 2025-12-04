package com.edscorp.eds.cctv.stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class GstProcessManager {

    // gstreamer.base-path:/usr/bin/gst-launch-1.0
    @Value("${gstreamer.base-path}")
    private String gstBasePath;

    private final WebClient webClient = WebClient.create();

    @Value("${janus.host:}")
    private String janusHost;

    private final Map<String, Boolean> runningProcesses = new ConcurrentHashMap<>();

    public boolean start(String key, String rtspUrl, int port, String type) {
        try {
            log.info("[{}] GStreamer start 요청: RTSP={} → UDP:{}", key, rtspUrl, port, type);
            stop(key);

            Map<String, Object> requestBody = Map.of(
                    "id", key,
                    "url", rtspUrl,
                    "port", port,
                    "type", type);

            webClient.post()
                    .uri(gstBasePath + "/start")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnError(e -> log.error("[{}] GStreamer API 호출 오류", key, e))
                    .subscribe(response -> log.info("[{}] GStreamer API start 응답: {}", key, response));

            runningProcesses.put(key, true);
            log.info("[{}] GStreamer start 요청 완료: RTSP={} → UDP:{}", key, rtspUrl, port, type);
            return true;
        } catch (Exception e) {
            log.error("[{}] GStreamer start 요청 실패", key, e);
            return false;
        }
    }

    /**
     * Node.js gstreamer-server에 stop 요청
     */
    public void stop(String key) {
        if (!runningProcesses.containsKey(key))
            return;

        Map<String, Object> requestBody = Map.of("key", key);

        webClient.post()
                .uri(gstBasePath + "/stop")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.error("[{}] GStreamer API stop 호출 오류", key, e))
                .subscribe(response -> log.info("[{}] GStreamer API stop 응답: {}", key, response));

        runningProcesses.remove(key);
        log.info("[{}] GStreamer stop 요청 완료", key);
    }
}