package com.edscorp.eds.cctv.stream;

import java.time.Duration;
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
    private record RtspFailureState(long failedAt, long retryAfter, String reason) {
        boolean isBlocked(long now) {
            return retryAfter > now;
        }
    }

    private final JanusApi janusApi;
    private final GstProcessManager gstProcessManager;

    private static final int BASE_VIDEO_PORT = 10000;
    private static final int KEEPALIVE_INTERVAL = 25;
    private static final long RTSP_FAILURE_COOLDOWN_MS = Duration.ofMinutes(5).toMillis();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, RtspFailureState> rtspFailureStates = new ConcurrentHashMap<>();

    @PostConstruct
    public void initKeepAlive() {
        scheduler.scheduleAtFixedRate(this::keepAliveAll, KEEPALIVE_INTERVAL, KEEPALIVE_INTERVAL, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        // 애플리케이션 종료 시에는 런타임 중 재사용하던 mountpoint/session도 모두 정리한다.
        // 평상시 restart 경로에서는 mountpoint를 유지하지만, 전체 종료 시에는 Janus 리소스를
        // 남기지 않도록 GST -> mountpoint -> session 순서로 teardown 한다.
        janusSessions.forEach((mountpointId, session) -> {
            try {
                gstProcessManager.stop(String.valueOf(mountpointId));
            } catch (Exception e) {
                log.warn("shutdown gst stop failed mountpoint={}", mountpointId, e);
            }

            try {
                janusApi.destroyMountpoint(session.sessionId, session.handleId, mountpointId);
            } catch (Exception e) {
                log.warn("shutdown destroyMountpoint failed mountpoint={}", mountpointId, e);
            }

            try {
                janusApi.destroySession(session.sessionId);
            } catch (Exception e) {
                log.warn("shutdown destroySession failed mountpoint={} sessionId={}",
                        mountpointId, session.sessionId, e);
            }
        });

        janusSessions.clear();
        rtspFailureStates.clear();
        scheduler.shutdownNow();
    }

    // ===================== ensureStream =====================
    public JanusApi.JanusSession ensureStream(
            int mountpointId, int videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {
        throwIfRtspBlocked(mountpointId, rtspUrl);

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

            // 실제 Janus 수신 포트 확인
            JsonNode infoNode = janusApi.getMountpointInfoNode(sessionId, handleId, mountpointId);
            int actualPort = infoNode.path("plugindata").path("data").path("info")
                    .path("media").path(0).path("port").asInt(-1);

            log.info("mountpoint info port mountpoint={} requestedPort={} actualPort={}",
                    mountpointId, videoPort, actualPort);

            if (actualPort <= 0) {
                throw new IllegalStateException("Janus mountpoint port not found. mountpoint=" + mountpointId);
            }

            // GStreamer는 actualPort로 쏴야 Janus가 받음
            GstProcessManager.StartResult startResult = gstProcessManager.startEnsureDetailed(
                    String.valueOf(mountpointId), rtspUrl, actualPort, type);

            if (!startResult.started()) {
                markRtspFailure(mountpointId, rtspUrl, startResult.reason());
                log.warn("GStreamer start failed mountpoint={} reason={}", mountpointId, startResult.reason());
                throw new IllegalStateException(
                        "GStreamer not alive after startEnsure. mountpoint=" + mountpointId + ", reason="
                                + startResult.reason());
            }

            clearRtspFailure(mountpointId);

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
        throwIfRtspBlocked(mountpointId, rtspUrl);

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
            throw new IllegalStateException(
                    "Janus mountpoint port not found after restart. mountpoint=" + mountpointId);
        }

        GstProcessManager.StartResult startResult = gstProcessManager.startNoStopDetailed(
                String.valueOf(mountpointId), rtspUrl, actualPort, type);

        if (!startResult.started()) {
            markRtspFailure(mountpointId, rtspUrl, startResult.reason());
            log.warn("GStreamer start failed after restart. mountpoint={} reason={}", mountpointId, startResult.reason());
            throw new IllegalStateException(
                    "GStreamer not alive after restart. mountpoint=" + mountpointId + ", reason="
                            + startResult.reason());
        }

        clearRtspFailure(mountpointId);

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

    public boolean isRtspBlocked(int mountpointId) {
        RtspFailureState state = rtspFailureStates.get(mountpointId);
        if (state == null) {
            return false;
        }

        long now = System.currentTimeMillis();
        if (!state.isBlocked(now)) {
            rtspFailureStates.remove(mountpointId, state);
            return false;
        }
        return true;
    }

    public String getRtspBlockReason(int mountpointId) {
        RtspFailureState state = rtspFailureStates.get(mountpointId);
        if (state == null) {
            return null;
        }

        long now = System.currentTimeMillis();
        if (!state.isBlocked(now)) {
            rtspFailureStates.remove(mountpointId, state);
            return null;
        }
        return state.reason();
    }

    private void throwIfRtspBlocked(int mountpointId, String rtspUrl) {
        RtspFailureState state = rtspFailureStates.get(mountpointId);
        if (state == null) {
            return;
        }

        long now = System.currentTimeMillis();
        if (!state.isBlocked(now)) {
            rtspFailureStates.remove(mountpointId, state);
            return;
        }

        long retryAfterMs = Math.max(0, state.retryAfter() - now);
        log.warn("RTSP reconnect blocked mountpoint={} retryAfterMs={} url={} reason={}",
                mountpointId, retryAfterMs, rtspUrl, state.reason());
        throw new IllegalStateException(
                "RTSP reconnect blocked. mountpoint=" + mountpointId + ", retryAfterMs=" + retryAfterMs
                        + ", reason=" + state.reason());
    }

    private void markRtspFailure(int mountpointId, String rtspUrl, String reason) {
        long now = System.currentTimeMillis();
        RtspFailureState state = new RtspFailureState(
                now,
                now + RTSP_FAILURE_COOLDOWN_MS,
                reason == null || reason.isBlank() ? "unknown RTSP/GStreamer start failure" : reason);
        rtspFailureStates.put(mountpointId, state);
        log.warn("RTSP failure recorded mountpoint={} cooldownMs={} url={} reason={}",
                mountpointId, RTSP_FAILURE_COOLDOWN_MS, rtspUrl, state.reason());
    }

    private void clearRtspFailure(int mountpointId) {
        rtspFailureStates.remove(mountpointId);
    }
}
