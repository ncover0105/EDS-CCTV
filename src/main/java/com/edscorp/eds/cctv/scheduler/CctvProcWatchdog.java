package com.edscorp.eds.cctv.scheduler;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
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

    // 마지막으로 alive=true였던 시각
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
            Integer mountId = e.getMountpointId();
            Integer videoPort = e.getVideoPort();
            String rtspUrl = e.getRtspUrl();

            if (mountId == null || videoPort == null || rtspUrl == null || rtspUrl.isBlank())
                continue;

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
                    log.info("statusProc UP {} / {} mountId={}",
                            e.getLocationCode(), e.getCctvCode(), mountId);
                }
                continue;
            }

            // alive=false인 경우: 마지막 정상시각이 없으면 "지금부터 다운 타이머 시작"
            long last = lastOkAt.getOrDefault(mountId, now);
            long downFor = now - last;

            if (downFor < DOWN_THRESHOLD_MS) {
                // 5분 미만이면 아무 조치도 하지 않음 (순간 끊김/지터 무시)
                continue;
            }

            // 5분 이상 다운 확정
            if (!Boolean.TRUE.equals(downNotified.get(mountId))) {
                downNotified.put(mountId, true);

                if (!"0".equals(e.getStatusProc())) {
                    e.setStatusProc("0");
                }

                log.warn("statusProc DOWN confirmed (no signal for {} ms) {} / {} mountId={}",
                        downFor, e.getLocationCode(), e.getCctvCode(), mountId);
            }
        }
    }
}
