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
            // 1) Janus 세션·핸들 생성
            JsonNode sess = janusApi.createSession();
            long sessionId = sess.path("data").path("id").asLong();
            JsonNode attach = janusApi.attachPlugin(sessionId);
            long handleId = attach.path("data").path("id").asLong();

            // 2) 기존 mountpoint 존재 여부 확인
            JsonNode list = janusApi.listMountpoints(sessionId, handleId);
            boolean exists = list.path("plugindata").path("data").path("list")
                    .findValuesAsText("id").contains(String.valueOf(mountpointId));

            // 3) RTSP mountpoint 생성 (없을 때만)
            // int videoPort = BASE_VIDEO_PORT + mountpointId;
            if (!exists) {
                janusApi.createMountpoint(sessionId, handleId, rtspUrl, mountpointId, videoPort, rtspId, rtspPw);
                log.info("Mountpoint {} 생성 완료 (port={})", mountpointId, videoPort);
            }

            // 4) GStreamer 실행 (RTSP → RTP)
            boolean started = gstProcessManager.start(String.valueOf(mountpointId), rtspUrl, videoPort, type);
            // String.valueOf(mountpointId), rtspUrl, videoPort, 50, true, 3);
            if (!started) {
                log.error("GStreamer 시작 실패 mountpoint={}", mountpointId);
            }

            // 5) 스케줄러에 세션 정보 저장
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
        // 1) gstreamer stop
        gstProcessManager.stop(String.valueOf(mountpointId));

        // 2) janus session destroy
        JanusApi.JanusSession s = janusSessions.remove(mountpointId);
        if (s != null) {
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