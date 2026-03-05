package com.edscorp.eds.cctv.scheduler;

import java.util.List;

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

    private static final long FIXED_DELAY_MS = 20_000; // 20초

    @Scheduled(fixedDelay = FIXED_DELAY_MS)
    @Transactional
    public void updateProcStatus() {

        // (선택) gst 서버 자체 다운이면 이번 라운드 스킵 권장
        // if (!gstProcessManager.isServerReachable()) return;

        List<CctvEntity> all = cctvRepository.findAll();

        for (CctvEntity e : all) {
            checkLegacyStream(e);
        }
    }

    private void checkLegacyStream(CctvEntity e) {
        // 현재 운영은 legacy(rtspUrl/mountpointId/videoPort) 기준으로 상태를 본다.
        // 추후 low/high 기반으로 전환 시, 품질별 집계(any-alive) 로직으로 확장.
        Integer mountId = e.getMountpointId();
        if (mountId == null) {
            if (!"0".equals(e.getStatusProc())) {
                e.setStatusProc("0");
                log.warn("statusProc DOWN [LEGACY] {} / {} mountId=null",
                        e.getLocationCode(), e.getCctvCode());
            }
            return;
        }
        String key = String.valueOf(mountId);

        boolean alive;
        try {
            alive = gstProcessManager.isAlive(key);
        } catch (Exception ex) {
            alive = false;
        }

        if (alive) {
            if (!"1".equals(e.getStatusProc())) {
                e.setStatusProc("1");
                log.info("statusProc UP [LEGACY] {} / {} mountId={}",
                        e.getLocationCode(), e.getCctvCode(), mountId);
            }
        } else {
            if (!"0".equals(e.getStatusProc())) {
                e.setStatusProc("0");
                log.warn("statusProc DOWN [LEGACY] {} / {} mountId={}",
                        e.getLocationCode(), e.getCctvCode(), mountId);
            }
        }
    }
}
