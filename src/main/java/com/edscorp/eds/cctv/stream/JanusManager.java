package com.edscorp.eds.cctv.stream;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.annotation.PostConstruct;
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

    // ===================== ensureStream =====================
    public JanusApi.JanusSession ensureStream(
            int mountpointId, int videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {

        return janusSessions.computeIfAbsent(mountpointId, id -> {
            // 1. Janus 세션 + 핸들 생성
            JsonNode sess = janusApi.createSession();
            long sessionId = sess.path("data").path("id").asLong();
            JsonNode attach = janusApi.attachPlugin(sessionId);
            long handleId = attach.path("data").path("id").asLong();

            // 2. Mountpoint 없으면 생성
            JsonNode list = janusApi.listMountpoints(sessionId, handleId);
            boolean exists = list.path("plugindata").path("data").path("list")
                    .findValuesAsText("id").contains(String.valueOf(mountpointId));

            if (!exists) {
                janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
                log.info("Mountpoint 생성 완료 mountpoint={} port={}", mountpointId, videoPort);
            }

            // 3. GStreamer 시작 (startEnsure = 기존 프로세스 정리 후 시작)
            boolean started = gstProcessManager.startEnsure(
                    String.valueOf(mountpointId), rtspUrl, videoPort, type);

            if (!started) {
                log.warn("GStreamer start failed mountpoint={}", mountpointId);
                throw new IllegalStateException(
                        "GStreamer not alive after startEnsure. mountpoint=" + mountpointId);
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
    // 순서: 1) gst stopAndWait → 2) janus destroy → 3) mountpoint 재생성 → 4) gst
    // startNoStop
    public synchronized JanusApi.JanusSession restartStream(
            int mountpointId, int videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {

        // 1. GStreamer 정지 대기
        gstProcessManager.stopAndWait(String.valueOf(mountpointId), 8000);

        // 2. Janus 세션/핸들/mountpoint 제거
        JanusApi.JanusSession prev = janusSessions.remove(mountpointId);
        if (prev != null) {
            try {
                janusApi.destroyMountpoint(prev.sessionId, prev.handleId, mountpointId);
            } catch (Exception e) {
                log.warn("destroyMountpoint failed mountpoint={}", mountpointId, e);
            }
            try {
                janusApi.destroySession(prev.sessionId);
            } catch (Exception e) {
                log.warn("destroySession failed mountpoint={}", mountpointId, e);
            }
        }

        // 3. Janus 세션/핸들/mountpoint 재생성
        JsonNode sess = janusApi.createSession();
        long sessionId = sess.path("data").path("id").asLong();
        JsonNode attach = janusApi.attachPlugin(sessionId);
        long handleId = attach.path("data").path("id").asLong();

        JsonNode list = janusApi.listMountpoints(sessionId, handleId);
        boolean exists = list.path("plugindata").path("data").path("list")
                .findValuesAsText("id").contains(String.valueOf(mountpointId));

        if (!exists) {
            janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
            log.info("Mountpoint 재생성 완료 mountpoint={} port={}", mountpointId, videoPort);
        }

        // 4. GStreamer 재시작 (stop 없이 시작 = startNoStop)
        boolean started = gstProcessManager.startNoStop(
                String.valueOf(mountpointId), rtspUrl, videoPort, type);

        if (!started) {
            log.warn("GStreamer start failed after restart. mountpoint={}", mountpointId);
            throw new IllegalStateException(
                    "GStreamer not alive after restart. mountpoint=" + mountpointId);
        }

        log.info("restartStream 완료 mountpoint={} url={}", mountpointId, rtspUrl);

        JanusApi.JanusSession js = new JanusApi.JanusSession();
        js.sessionId = sessionId;
        js.handleId = handleId;
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
            }
        });
    }
}