package com.edscorp.eds.cctv.scheduler;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.domain.CctvStream;
import com.edscorp.eds.cctv.domain.StreamQuality;
import com.edscorp.eds.cctv.repository.CctvRepository;
import com.edscorp.eds.cctv.stream.GstProcessManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CctvProcWatchdog {

    private final CctvRepository cctvRepository;
    private final GstProcessManager gstProcessManager;

    // mountpointId 기준 마지막 alive=true 시각
    private final ConcurrentHashMap<Integer, Long> lastOkAt = new ConcurrentHashMap<>();
    // 5분 다운 확정 후 중복 처리 방지
    private final ConcurrentHashMap<Integer, Boolean> downNotified = new ConcurrentHashMap<>();

    private static final long FIXED_DELAY_MS = 20_000; // 20초
    private static final long DOWN_THRESHOLD_MS = 5 * 60_000L; // 5분

    @Scheduled(fixedDelay = FIXED_DELAY_MS)
    @Transactional
    public void updateProcStatus() {

        // (선택) gst 서버 자체 다운이면 이번 라운드 스킵 권장
        // if (!gstProcessManager.isServerReachable()) return;

        long now = System.currentTimeMillis();
        List<CctvEntity> all = cctvRepository.findAll();

        for (CctvEntity e : all) {
            // ✅ LOW/HIGH 각각 감시
            for (StreamQuality quality : StreamQuality.values()) {
                checkStream(e, quality, now);
            }
        }
    }

    private void checkStream(CctvEntity e, StreamQuality quality, long now) {
        CctvStream stream = e.getStream(quality);

        // ✅ 스트림이 없거나 유효하지 않으면 스킵
        if (stream == null || !stream.isValid())
            return;

        Integer mountId = stream.getMountpointId();
        String key = String.valueOf(mountId);

        boolean alive;
        try {
            alive = gstProcessManager.isAlive(key);
        } catch (Exception ex) {
            alive = false;
        }

        if (alive) {
            lastOkAt.put(mountId, now);
            downNotified.put(mountId, false);

            if (!"1".equals(e.getStatusProc())) {
                e.setStatusProc("1");
                log.info("statusProc UP [{}}] {} / {} mountId={}",
                        quality, e.getLocationCode(), e.getCctvCode(), mountId);
            }
            return;
        }

        // alive=false: 마지막 정상 시각 기준 다운 시간 계산
        long last = lastOkAt.getOrDefault(mountId, now);
        long downFor = now - last;

        if (downFor < DOWN_THRESHOLD_MS) {
            // 5분 미만 순간 끊김 → 무시
            return;
        }

        // 5분 이상 다운 확정
        if (!Boolean.TRUE.equals(downNotified.get(mountId))) {
            downNotified.put(mountId, true);

            if (!"0".equals(e.getStatusProc())) {
                e.setStatusProc("0");
            }

            log.warn("statusProc DOWN confirmed ({}ms) [{}] {} / {} mountId={}",
                    downFor, quality, e.getLocationCode(), e.getCctvCode(), mountId);
        }
    }
}
