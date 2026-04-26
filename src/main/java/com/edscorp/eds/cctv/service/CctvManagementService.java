package com.edscorp.eds.cctv.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.domain.CctvStream;
import com.edscorp.eds.cctv.domain.StreamQuality;
import com.edscorp.eds.cctv.dto.CctvCreateRequest;
import com.edscorp.eds.cctv.dto.CctvUpdateRequest;
import com.edscorp.eds.cctv.repository.CctvRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CctvManagementService {

    private final CctvRepository cctvRepository;
    private final CameraCache cameraCache;
    private final CctvStreamService cctvStreamService;

    // ==================== Utill ====================
    private boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private int parsePort(String wsPort) {
        try {
            return Integer.parseInt(wsPort);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    // ==================== Cache ====================
    public List<Map<String, Object>> getCameras() {
        log.info("getCameras() 카메라 리스트 캐싱 >>>>>>>>>>>");
        List<CctvEntity> entityList = cctvRepository.findAll();
        List<Map<String, Object>> cameras = new ArrayList<>();

        for (CctvEntity entity : entityList) {
            Map<String, Object> camera = new HashMap<>();
            camera.put("name", entity.getName());
            camera.put("cctvCode", entity.getCctvCode());
            camera.put("address", entity.getAddress());
            camera.put("id", entity.getId());
            camera.put("password", entity.getPassword());
            camera.put("type", entity.getType());
            camera.put("wsPort", parsePort(entity.getWsPort()));
            camera.put("locationCode", entity.getLocationCode());
            camera.put("latitude", entity.getLatitude());
            camera.put("longitude", entity.getLongitude());
            camera.put("status", entity.getStatusCam());
            camera.put("statusProc", entity.getStatusProc());

            // 기본/low/high 필드는 항상 내려준다(null 포함)
            camera.put("rtspUrl", hasText(entity.getRtspUrl())
                    ? cctvStreamService.buildRtspUrlWithAuth(entity, entity.getRtspUrl())
                    : null);
            camera.put("mountpointId", entity.getMountpointId());
            camera.put("videoPort", entity.getVideoPort());

            camera.put("lowRtspUrl", null);
            camera.put("lowMountpointId", null);
            camera.put("lowVideoPort", null);
            camera.put("highRtspUrl", null);
            camera.put("highMountpointId", null);
            camera.put("highVideoPort", null);

            // low / high 스트림 정보
            for (StreamQuality quality : StreamQuality.values()) {
                CctvStream stream = entity.getStream(quality);
                if (stream != null && stream.isValid()) {
                    String prefix = quality.name().toLowerCase();
                    camera.put(prefix + "RtspUrl",
                            cctvStreamService.buildRtspUrlWithAuth(entity, stream.getRtspUrl()));
                    camera.put(prefix + "MountpointId", stream.getMountpointId());
                    camera.put(prefix + "VideoPort", stream.getVideoPort());
                }
            }

            cameras.add(camera);
        }

        cameraCache.setCameras(cameras);
        return cameras;
    }

    public List<Map<String, Object>> getAllCameras() {
        return cameraCache.getCameras();
    }

    public List<CctvEntity> getAllCCTVList() {
        return cctvRepository.findAll();
    }

    private void refreshCache() {
        try {
            getCameras();
        } catch (Exception ex) {
            log.error("camera cache refresh failed", ex);
        }
    }

    // ===================== CRUD =====================
    @Transactional
    public CctvEntity create(CctvCreateRequest req) {
        if (req.getCctvCode() == null || req.getCctvCode().isBlank()) {
            throw new IllegalArgumentException("cctvCode는 필수입니다.");
        }
        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("name은 필수입니다.");
        }

        String locationCode = hasText(req.getLocationCode())
                ? req.getLocationCode()
                : req.getCctvCode();

        if (cctvRepository.existsByLocationCodeAndCctvCode(locationCode, req.getCctvCode())) {
            throw new IllegalArgumentException("이미 존재하는 CCTV 입니다: " + locationCode + "/" + req.getCctvCode());
        }

        CctvEntity e = new CctvEntity();
        e.setLocationCode(locationCode);
        e.setCctvCode(req.getCctvCode());
        e.setName(req.getName());
        e.setLatitude(req.getLatitude());
        e.setLongitude(req.getLongitude());
        e.setId(req.getId());
        e.setPassword(req.getPassword());
        e.setAddress(req.getAddress());
        e.setType(req.getType());
        e.setWsPort(req.getWsPort());
        e.setStatusCam(req.getStatusCam());
        e.setRtspUrl(req.getRtspUrl());
        e.setMountpointId(req.getMountpointId());
        e.setVideoPort(req.getVideoPort());

        // ✅ CctvStream VO로 low/high 설정
        if (hasText(req.getLowRtspUrl())) {
            CctvStream low = new CctvStream();
            low.setRtspUrl(req.getLowRtspUrl());
            low.setMountpointId(req.getLowMountpointId());
            low.setVideoPort(req.getLowVideoPort());
            e.setLowStream(low);
        }
        if (hasText(req.getHighRtspUrl())) {
            CctvStream high = new CctvStream();
            high.setRtspUrl(req.getHighRtspUrl());
            high.setMountpointId(req.getHighMountpointId());
            high.setVideoPort(req.getHighVideoPort());
            e.setHighStream(high);
        }

        CctvEntity saved = cctvRepository.save(e);
        refreshCache();

        try {
            // 기본 생성은 legacy 스트림만 수행 (low/high 생성 제외)
            cctvStreamService.ensureLegacyIfPresent(saved);

        } catch (Exception ex) {
            log.error("ensureStream failed after create: cctvCode={}", saved.getCctvCode(), ex);
            cctvStreamService.updateStatusProcIfPresent(saved.getLocationCode(), saved.getCctvCode(), 0);
        }

        return saved;
    }

    @Transactional
    public CctvEntity update(String locationCode, String cctvCode, CctvUpdateRequest req) {
        CctvEntity existing = cctvRepository.findByLocationCodeAndCctvCode(locationCode, cctvCode)
                .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " + locationCode + "/" + cctvCode));

        String password = hasText(req.getPassword()) ? req.getPassword() : existing.getPassword();
        String lowRtspUrl = hasText(req.getLowRtspUrl()) ? req.getLowRtspUrl() : null;
        Integer lowMountpointId = lowRtspUrl != null ? req.getLowMountpointId() : null;
        Integer lowVideoPort = lowRtspUrl != null ? req.getLowVideoPort() : null;
        String highRtspUrl = hasText(req.getHighRtspUrl()) ? req.getHighRtspUrl() : null;
        Integer highMountpointId = highRtspUrl != null ? req.getHighMountpointId() : null;
        Integer highVideoPort = highRtspUrl != null ? req.getHighVideoPort() : null;

        int updated = cctvRepository.updateCctvConfig(
                locationCode,
                cctvCode,
                req.getName(),
                req.getAddress(),
                req.getId(),
                password,
                req.getType(),
                req.getWsPort(),
                req.getLatitude(),
                req.getLongitude(),
                req.getRtspUrl(),
                req.getMountpointId(),
                req.getVideoPort(),
                lowRtspUrl,
                lowMountpointId,
                lowVideoPort,
                highRtspUrl,
                highMountpointId,
                highVideoPort);

        if (updated == 0) {
            throw new IllegalArgumentException("CCTV not found: " + locationCode + "/" + cctvCode);
        }

        refreshCache();
        return cctvRepository.findByLocationCodeAndCctvCode(locationCode, cctvCode)
                .orElseThrow(() -> new IllegalArgumentException("CCTV not found after update: " + locationCode + "/" + cctvCode));
    }

    @Transactional
    public void delete(String locationCode, String cctvCode) {
        if (!cctvRepository.existsByLocationCodeAndCctvCode(locationCode, cctvCode)) {
            throw new IllegalArgumentException("CCTV not found: " + locationCode + "/" + cctvCode);
        }
        cctvRepository.deleteByLocationCodeAndCctvCode(locationCode, cctvCode);
        refreshCache();
    }

    // ===================== Status =====================
    @Transactional
    public void updateStatusCam(String locationCode, String cctvCode, int statusCam) {
        CctvEntity entity = cctvRepository
                .findByLocationCodeAndCctvCode(locationCode, cctvCode)
                .orElseThrow(() -> new IllegalArgumentException(
                        "CCTV not found: " + locationCode + "/" + cctvCode));

        String newVal = String.valueOf(statusCam);
        if (!newVal.equals(entity.getStatusCam())) {
            entity.setStatusCam(newVal);
        }
    }
}
