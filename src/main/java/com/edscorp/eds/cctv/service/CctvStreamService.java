package com.edscorp.eds.cctv.service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.domain.CctvStream;
import com.edscorp.eds.cctv.domain.StreamQuality;
import com.edscorp.eds.cctv.repository.CctvRepository;
import com.edscorp.eds.cctv.stream.JanusApi;
import com.edscorp.eds.cctv.stream.JanusManager;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CctvStreamService {

    private final CctvRepository cctvRepository;
    private final JanusManager janusManager;
    private final JanusApi janusApi;

    private final ConcurrentHashMap<Integer, Object> restartLocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Long> lastRestartAt = new ConcurrentHashMap<>();
    private final AtomicBoolean restartAllRunning = new AtomicBoolean(false);
    private static final long RESTART_COOLDOWN_MS = 30_000;

    // ===================== 유틸 =====================
    boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }

    String buildRtspUrlWithAuth(CctvEntity entity, String rawRtsp) {
        if (!hasText(rawRtsp))
            return "rtsp://";
        String base = rawRtsp.startsWith("rtsp://")
                ? rawRtsp.substring("rtsp://".length())
                : rawRtsp;

        return hasText(entity.getId())
                ? "rtsp://" + entity.getId() + ":" + entity.getPassword() + "@" + base
                : "rtsp://" + base;
    }

    private Object lockFor(Integer mountId) {
        return restartLocks.computeIfAbsent(mountId, k -> new Object());
    }

    private boolean isInCooldown(Integer mountId) {
        long now = System.currentTimeMillis();
        long last = lastRestartAt.getOrDefault(mountId, 0L);
        return (now - last) < RESTART_COOLDOWN_MS;
    }

    private void markRestart(Integer mountId) {
        lastRestartAt.put(mountId, System.currentTimeMillis());
    }

    public boolean isJanusConnected() {
        return janusApi.checkJanusConnection();
    }

    // ===================== 초기화 =====================
    @PostConstruct
    public void init() {
        log.info("CctvStreamService: 초기화 시작");

        if (!janusApi.checkJanusConnection()) {
            log.error("Janus 연결 실패, Mountpoint 생성을 중단합니다.");
            return;
        }

        // 필요하면 부팅 시 자동 ensure
        // ensureAllStreamsAsync();

        log.info("CctvStreamService: 초기화 완료");
    }

    // ===================== ensure =====================
    private void ensureOne(String locationCode, String cctvCode,
            Integer mountId, Integer videoPort,
            String rtspUrl, String rtspId, String rtspPw, String type) {

        if (mountId == null || videoPort == null || !hasText(rtspUrl) || "rtsp://".equals(rtspUrl)) {
            return;
        }

        Object lock = lockFor(mountId);
        synchronized (lock) {
            try {
                janusManager.ensureStream(mountId, videoPort, rtspUrl, rtspId, rtspPw, type);
                updateStatusProcIfPresent(locationCode, cctvCode, 1);
                markRestart(mountId);
            } catch (Exception e) {
                log.error("ensureStream failed mountpoint={} url={}", mountId, rtspUrl, e);
                updateStatusProcIfPresent(locationCode, cctvCode, 0);
            }
        }
    }

    public void ensureStreamIfPresent(CctvEntity e, StreamQuality quality) {
        CctvStream stream = e.getStream(quality);
        if (stream == null || !stream.isValid())
            return;

        String rtsp = buildRtspUrlWithAuth(e, stream.getRtspUrl());
        ensureOne(e.getLocationCode(), e.getCctvCode(),
                stream.getMountpointId(), stream.getVideoPort(),
                rtsp, e.getId(), e.getPassword(), e.getType());
    }

    public void ensureLegacyIfPresent(CctvEntity e) {
        if (!hasText(e.getRtspUrl()) || e.getMountpointId() == null || e.getVideoPort() == null) {
            return;
        }
        String rtsp = buildRtspUrlWithAuth(e, e.getRtspUrl());
        ensureOne(e.getLocationCode(), e.getCctvCode(),
                e.getMountpointId(), e.getVideoPort(),
                rtsp, e.getId(), e.getPassword(), e.getType());
    }

    public void ensureAllQualitiesIfPresent(CctvEntity e) {
        for (StreamQuality quality : StreamQuality.values()) {
            ensureStreamIfPresent(e, quality);
        }
    }

    @Async
    public void ensureAllStreamsAsync() {
        List<CctvEntity> all = cctvRepository.findAll();
        for (CctvEntity e : all) {
            // 기본은 legacy(rtspUrl/mountpointId/videoPort)만 생성
            ensureLegacyIfPresent(e);
        }
    }

    // ===================== restart =====================
    @Async
    public void restartAsync(String locationCode, String cctvCode) {
        restart(locationCode, cctvCode, true);
    }

    @Async
    public void restartAllStreamsAsync(boolean force) {
        restartAllStreams(force);
    }

    @Transactional
    public void restart(String locationCode, String cctvCode) {
        restart(locationCode, cctvCode, false);
    }

    @Transactional
    public void restart(String locationCode, String cctvCode, boolean force) {
        CctvEntity e = cctvRepository.findByLocationCodeAndCctvCode(locationCode, cctvCode)
                .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " + locationCode + "/" + cctvCode));

        restartLegacyIfPresent(e, force);
    }

    private void restartStreamIfPresent(CctvEntity e, StreamQuality quality, boolean force) {
        CctvStream stream = e.getStream(quality);
        if (stream == null || !stream.isValid())
            return;

        Integer mountId = stream.getMountpointId();
        Object lock = lockFor(mountId);

        synchronized (lock) {
            if (!force && isInCooldown(mountId))
                return;
            String rtsp = buildRtspUrlWithAuth(e, stream.getRtspUrl());
            try {
                janusManager.restartStream(mountId, stream.getVideoPort(),
                        rtsp, e.getId(), e.getPassword(), e.getType());
                updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 1);
                markRestart(mountId);
            } catch (Exception ex) {
                log.error("restartStream failed ({}) mountpoint={} url={}",
                        quality, mountId, rtsp, ex);
                updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 0);
            }
        }
    }

    private void restartLegacyIfPresent(CctvEntity e, boolean force) {
        if (!hasText(e.getRtspUrl()) || e.getMountpointId() == null || e.getVideoPort() == null) {
            return;
        }

        Integer mountId = e.getMountpointId();
        Object lock = lockFor(mountId);
        synchronized (lock) {
            if (!force && isInCooldown(mountId))
                return;
            String rtsp = buildRtspUrlWithAuth(e, e.getRtspUrl());
            try {
                janusManager.restartStream(mountId, e.getVideoPort(),
                        rtsp, e.getId(), e.getPassword(), e.getType());
                updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 1);
                markRestart(mountId);
            } catch (Exception ex) {
                log.error("restartStream failed (LEGACY) mountpoint={} url={}",
                        mountId, rtsp, ex);
                updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 0);
            }
        }
    }

    @Transactional
    public void restartAllStreams(boolean force) {
        if (!restartAllRunning.compareAndSet(false, true)) {
            throw new IllegalStateException("전체 CCTV 재시작이 이미 진행 중입니다.");
        }

        try {
            List<CctvEntity> all = cctvRepository.findAll();
            for (CctvEntity e : all) {
                restart(e.getLocationCode(), e.getCctvCode(), force);
            }
        } finally {
            restartAllRunning.set(false);
        }
    }

    // ===================== statusProc =====================
    public void updateStatusProc(String locationCode, String cctvCode, int statusProc) {
        String newVal = String.valueOf(statusProc);
        int updated = cctvRepository.updateStatusProc(locationCode, cctvCode, newVal);
        if (updated == 0) {
            throw new IllegalArgumentException("CCTV not found: " + locationCode + "/" + cctvCode);
        }
    }

    public void updateStatusProcIfPresent(String locationCode, String cctvCode, int statusProc) {
        if (!hasText(locationCode) || !hasText(cctvCode))
            return;
        updateStatusProc(locationCode, cctvCode, statusProc);
    }
}
