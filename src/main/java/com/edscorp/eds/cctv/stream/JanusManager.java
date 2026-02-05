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
    private static final int BASE_VIDEO_PORT = 10000; // RTP 포트 시작 번호, 환경에 맞게 변경
    private static final int KEEPALIVE_INTERVAL = 25; // 초 단위

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions = new ConcurrentHashMap<>();

    private final GstProcessManager gstProcessManager;

    private final ConcurrentHashMap<Integer, Integer> failCount = new ConcurrentHashMap<>();
    private static final int FAIL_THRESHOLD = 3;
    private static final int WATCHDOG_INTERVAL = 10;

    @PostConstruct
    public void initKeepAlive() {
        scheduler.scheduleAtFixedRate(this::keepAliveAll, KEEPALIVE_INTERVAL, KEEPALIVE_INTERVAL, TimeUnit.SECONDS);
    }

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

            boolean started = gstProcessManager.start(String.valueOf(mountpointId), rtspUrl, videoPort, type);
            if (!started) {
                // ✅ 즉시 끊지 않음: 5분 watchdog이 정리할 것
                log.warn("GStreamer start failed now, will be handled by 5-min watchdog. mountpoint={}", mountpointId);
            }

            JanusApi.JanusSession js = new JanusApi.JanusSession();
            js.sessionId = sessionId;
            js.handleId = handleId;
            return js;
        });
    }

    public JanusApi.JanusSession ensureMountpoint(int mountpointId, String rtspUrl, String rtspId, String rtspPw) {
        return janusSessions.computeIfAbsent(mountpointId,
                id -> createSessionWithMountpoint(id, rtspUrl, rtspId, rtspPw));
    }

    private JanusApi.JanusSession createSessionWithMountpoint(int mountpointId, String rtspUrl, String rtspId,
            String rtspPw) {
        log.info("Creating Janus session for mountpoint {}", mountpointId);

        JsonNode sessionRes = janusApi.createSession();
        long sessionId = sessionRes.path("data").path("id").asLong();

        JsonNode attachRes = janusApi.attachPlugin(sessionId);
        long handleId = attachRes.path("data").path("id").asLong();

        JsonNode listRes = janusApi.listMountpoints(sessionId, handleId);
        boolean exists = listRes.path("plugindata").path("data").path("list")
                .findValuesAsText("id").contains(String.valueOf(mountpointId));

        if (!exists) {
            int videoPort = BASE_VIDEO_PORT + (mountpointId);
            // janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId,
            // videoPort, rtspId, rtspPw);
            JsonNode mpNode = janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId,
                    rtspPw);
            log.info("✅ Mountpoint {} 생성 완료", mountpointId);

            if (mpNode.has("plugindata")) {
                JsonNode data = mpNode.get("plugindata").get("data");
                if (data.has("video") && data.get("video").has("codec")) {
                    String videoCodec = data.get("video").get("codec").asText();
                    log.info("🎬 Mountpoint {} Video Codec: {}", mountpointId, videoCodec);
                } else {
                    log.warn("⚠️ Mountpoint {} Video Codec 정보 없음", mountpointId);
                }
                if (data.has("audio") && data.get("audio").has("codec")) {
                    String audioCodec = data.get("audio").get("codec").asText();
                    log.info("🔊 Mountpoint {} Audio Codec: {}", mountpointId, audioCodec);
                }
            }
        } else {
            log.info("ℹ️ Mountpoint {} 이미 존재", mountpointId);
        }

        JanusApi.JanusSession session = new JanusApi.JanusSession();
        session.sessionId = sessionId;
        session.handleId = handleId;
        return session;
    }

    public synchronized void stopStream(int mountpointId) {
        // gstreamer stop (카메라 RTP 송출 중지)
        gstProcessManager.stop(String.valueOf(mountpointId));

        // janus session/handle 가져와서 mountpoint까지 제거
        JanusApi.JanusSession s = janusSessions.remove(mountpointId);
        if (s != null) {
            // mountpoint destroy (해당 카메라 연결 정보 제거)
            try {
                janusApi.destroyMountpoint(s.sessionId, s.handleId, mountpointId);
            } catch (Exception e) {
                log.warn("destroyMountpoint failed mountpoint={}", mountpointId, e);
            }

            // session destroy (해당 카메라에 붙어있던 Janus 세션 정리)
            try {
                janusApi.destroySession(s.sessionId);
            } catch (Exception e) {
                log.warn("destroySession failed mountpoint={}", mountpointId, e);
            }
        }
    }

    public synchronized JanusApi.JanusSession restartStream(
            int mountpointId, int videoPort, String rtspUrl, String rtspId, String rtspPw, String type) {

        stopStream(mountpointId);
        return ensureStream(mountpointId, videoPort, rtspUrl, rtspId, rtspPw, type);
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