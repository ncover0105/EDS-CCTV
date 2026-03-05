package com.edscorp.eds.cctv.stream;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class JanusManager {
    private final JanusApi janusApi;
    private final GstProcessManager gstProcessManager;

    private static final int BASE_VIDEO_PORT = 10000;
    private static final int KEEPALIVE_INTERVAL = 25;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void initKeepAlive() {
        scheduler.scheduleAtFixedRate(this::keepAliveAll, KEEPALIVE_INTERVAL, KEEPALIVE_INTERVAL, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    // ===================== ensureStream =====================
    public JanusApi.JanusSession ensureStream(
            int mountpointId, int videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {

        return janusSessions.computeIfAbsent(mountpointId, id -> {
            JsonNode sess = janusApi.createSession();
            long sessionId = sess.path("data").path("id").asLong();

            JsonNode attach = janusApi.attachPlugin(sessionId);
            long handleId = attach.path("data").path("id").asLong();

            JsonNode list = janusApi.listMountpoints(sessionId, handleId);
            boolean exists = list.path("plugindata").path("data").path("list")
                    .findValuesAsText("id").contains(String.valueOf(mountpointId));

            if (!exists) {
                janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
                log.info("Mountpoint 생성 완료 mountpoint={} requestedPort={}", mountpointId, videoPort);
            }

            // ✅ 실제 Janus 수신 포트 확인
            JsonNode infoNode = janusApi.getMountpointInfoNode(sessionId, handleId, mountpointId);
            int actualPort = infoNode.path("plugindata").path("data").path("info")
                    .path("media").path(0).path("port").asInt(-1);

            log.info("mountpoint info port mountpoint={} requestedPort={} actualPort={}",
                    mountpointId, videoPort, actualPort);

            if (actualPort <= 0) {
                throw new IllegalStateException("Janus mountpoint port not found. mountpoint=" + mountpointId);
            }

            // ✅ GStreamer는 actualPort로 쏴야 Janus가 받음
            boolean started = gstProcessManager.startEnsure(
                    String.valueOf(mountpointId), rtspUrl, actualPort, type);

            if (!started) {
                log.warn("GStreamer start failed mountpoint={}", mountpointId);
                throw new IllegalStateException("GStreamer not alive after startEnsure. mountpoint=" + mountpointId);
            }

            log.info("ensureStream 완료 mountpoint={} url={}", mountpointId, rtspUrl);

            JanusApi.JanusSession js = new JanusApi.JanusSession();
            js.sessionId = sessionId;
            js.handleId = handleId;
            return js;
        });
    }

    // ===================== stopStream =====================
    public synchronized void stopStream(int mountpointId) {
        gstProcessManager.stop(String.valueOf(mountpointId));

        JanusApi.JanusSession s = janusSessions.remove(mountpointId);
        if (s != null) {
            try {
                janusApi.destroyMountpoint(s.sessionId, s.handleId, mountpointId);
            } catch (Exception e) {
                log.warn("destroyMountpoint failed mountpoint={}", mountpointId, e);
            }
            try {
                janusApi.destroySession(s.sessionId);
            } catch (Exception e) {
                log.warn("destroySession failed mountpoint={}", mountpointId, e);
            }
        }
    }

    // ===================== restartStream =====================
    // 순서: 1) gst stopAndWait → 2) mountpoint 존재 확인(없으면 생성) → 3) gst startNoStop
    // 운영 안정성을 위해 restart 시 mountpoint/session 파괴는 하지 않는다.
    public synchronized JanusApi.JanusSession restartStream(
            int mountpointId, int videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {

        // 1. GStreamer 정지 대기
        gstProcessManager.stopAndWait(String.valueOf(mountpointId), 8000);

        // 2. 세션 확보(기존 세션 우선, 없으면 생성)
        JanusApi.JanusSession js = janusSessions.get(mountpointId);
        if (js == null) {
            JsonNode sess = janusApi.createSession();
            long sessionId = sess.path("data").path("id").asLong();
            JsonNode attach = janusApi.attachPlugin(sessionId);
            long handleId = attach.path("data").path("id").asLong();
            js = new JanusApi.JanusSession();
            js.sessionId = sessionId;
            js.handleId = handleId;
        }

        // 3. mountpoint 존재 확인(없으면 생성)
        JsonNode list = janusApi.listMountpoints(js.sessionId, js.handleId);
        boolean exists = list.path("plugindata").path("data").path("list")
                .findValuesAsText("id").contains(String.valueOf(mountpointId));

        if (!exists) {
            janusApi.createMountpoint(js.sessionId, js.handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
            log.info("Mountpoint 생성(재시작 경로) 완료 mountpoint={} port={}", mountpointId, videoPort);
        }

        // 4. 실제 Janus 수신 포트 조회 후 GStreamer 재시작
        JsonNode infoNode = janusApi.getMountpointInfoNode(js.sessionId, js.handleId, mountpointId);
        int actualPort = infoNode.path("plugindata").path("data").path("info")
                .path("media").path(0).path("port").asInt(-1);
        if (actualPort <= 0) {
            throw new IllegalStateException("Janus mountpoint port not found after restart. mountpoint=" + mountpointId);
        }

        boolean started = gstProcessManager.startNoStop(
                String.valueOf(mountpointId), rtspUrl, actualPort, type);

        if (!started) {
            log.warn("GStreamer start failed after restart. mountpoint={}", mountpointId);
            throw new IllegalStateException(
                    "GStreamer not alive after restart. mountpoint=" + mountpointId);
        }

        log.info("restartStream 완료 mountpoint={} requestedPort={} actualPort={} url={}",
                mountpointId, videoPort, actualPort, rtspUrl);

        janusSessions.put(mountpointId, js);
        return js;
    }

    // ===================== keepAlive =====================
    private void keepAliveAll() {
        janusSessions.forEach((mpId, session) -> {
            try {
                janusApi.keepAlive(session.sessionId);
            } catch (Exception e) {
                log.error("KeepAlive 실패 mountpoint={}", mpId, e);
                // 죽은 세션을 제거해 다음 ensure/restart에서 재생성되도록 한다.
                if (janusSessions.remove(mpId, session)) {
                    gstProcessManager.stop(String.valueOf(mpId));
                    log.warn("stale Janus session removed mountpoint={}", mpId);
                }
            }
        });
    }
}
