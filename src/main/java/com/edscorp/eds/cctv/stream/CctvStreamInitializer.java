package com.edscorp.eds.cctv.stream;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.edscorp.eds.cctv.service.CctvManagementService;
import com.edscorp.eds.cctv.service.CctvStreamService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CctvStreamInitializer {

    private final CctvStreamService cctvStreamService;
    private final CctvManagementService cctvManagementService;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info("CctvStreamInitializer START thread={}", Thread.currentThread().getName());
        long t0 = System.currentTimeMillis();

        // CameraCache 초기화
        try {
            cctvManagementService.getCameras();
            log.info("CameraCache 초기화 완료");
        } catch (Exception e) {
            log.error("CameraCache 초기화 실패", e);
        }

        // Janus 연결 확인
        if (!cctvStreamService.isJanusConnected()) {
            log.error("Janus is not running, stream initialization skipped");
            return;
        }

        // 스트림 기동
        cctvStreamService.ensureAllStreamsAsync();
        log.info("CctvStreamInitializer END elapsedMs={}", System.currentTimeMillis() - t0);
    }

    // private final CctvService cctvService;
    // private final JanusApi janusApi;

    // @EventListener(ApplicationReadyEvent.class)
    // public void onReady() {

    // log.info("CctvStreamInitializer START thread={}",
    // Thread.currentThread().getName());

    // long t0 = System.currentTimeMillis();

    // if (!janusApi.checkJanusConnection()) {
    // log.error("Janus is not running");
    // return;
    // }
    // cctvService.ensureAllStreamsAsync();

    // log.info("CctvStreamInitializer END elapsedMs={}",
    // System.currentTimeMillis() - t0);
    // }
}
