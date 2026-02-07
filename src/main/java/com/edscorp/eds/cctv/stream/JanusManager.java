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

    /**
     * ✅ 최초 보장/ensure 경로: gst는 startEnsure 사용 (살아있으면 stopAndWait 후 start)
     */
    public JanusApi.JanusSession ensureStream(int mountpointId, int videoPort, String rtspUrl, String rtspId,
            String rtspPw, String type) {

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
                log.info("Mountpoint {} 생성 완료 (port={})", mountpointId, videoPort);
            }

            boolean started = gstProcessManager.startEnsure(String.valueOf(mountpointId), rtspUrl, videoPort, type);
            if (!started) {
                log.warn("GStreamer start failed now. mountpoint={}", mountpointId);
            }

            JanusApi.JanusSession js = new JanusApi.JanusSession();
            js.sessionId = sessionId;
            js.handleId = handleId;
            return js;
        });
    }

    /**
     * ✅ stopStream은 stop 요청 + janus 정리
     * (여기서는 stopAndWait까지는 넣지 않는다: restart 흐름에서 순서를 통제)
     */
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

    /**
     * ✅ restartStream: "중복 STOP"이 나오지 않도록 순서를 고정한다
     * 1) gst stopAndWait (실제 내려갈 때까지)
     * 2) janus destroy/session 정리
     * 3) 새 session/handle/mountpoint 보장
     * 4) gst startNoStop (여기서는 절대 stop 하지 않음)
     */
    public synchronized JanusApi.JanusSession restartStream(
            int mountpointId, int videoPort, String rtspUrl, String rtspId, String rtspPw, String type) {

        // 1) gst 완전 종료 대기 (레이스 제거)
        gstProcessManager.stopAndWait(String.valueOf(mountpointId), 8_000);

        // 2) janus 정리
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

        // 3) 새 세션 + mountpoint 보장
        JsonNode sess = janusApi.createSession();
        long sessionId = sess.path("data").path("id").asLong();

        JsonNode attach = janusApi.attachPlugin(sessionId);
        long handleId = attach.path("data").path("id").asLong();

        JsonNode list = janusApi.listMountpoints(sessionId, handleId);
        boolean exists = list.path("plugindata").path("data").path("list")
                .findValuesAsText("id").contains(String.valueOf(mountpointId));

        if (!exists) {
            janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
            log.info("Mountpoint {} 생성 완료 (port={})", mountpointId, videoPort);
        }

        // 4) gst start (stop 절대 금지)
        boolean started = gstProcessManager.startNoStop(String.valueOf(mountpointId), rtspUrl, videoPort, type);
        if (!started) {
            log.warn("GStreamer start failed after restart. mountpoint={}", mountpointId);
        }

        JanusApi.JanusSession js = new JanusApi.JanusSession();
        js.sessionId = sessionId;
        js.handleId = handleId;
        janusSessions.put(mountpointId, js);
        return js;
    }

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