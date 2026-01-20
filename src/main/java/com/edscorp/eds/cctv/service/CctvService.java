package com.edscorp.eds.cctv.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.dto.CctvCreateRequest;
import com.edscorp.eds.cctv.dto.CctvUpdateRequest;
import com.edscorp.eds.cctv.repository.CctvRepository;
import com.edscorp.eds.cctv.stream.JanusApi;
import com.edscorp.eds.cctv.stream.JanusManager;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.EnableAsync;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@EnableAsync
public class CctvService {

    private final CctvRepository cctvRepository;
    private final CameraCache cameraCache;
    private final JanusManager janusManager;
    private final JanusApi janusApi;

    private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("CctvService: 초기화 시작");

        // Janus 연결 확인
        if (!janusApi.checkJanusConnection()) {
            log.error("Janus 연결 실패, Mountpoint 생성을 중단합니다.");
            getCameras();
            return;
        }

        getCameras().forEach(cam -> {
            Integer mountId = (Integer) cam.get("mountpointId");
            String rtspUrl = (String) cam.get("rtspUrl");
            String rtspId = (String) cam.get("id");
            String rtspPw = (String) cam.get("password");
            Integer vdieoPort = (Integer) cam.get("videoPort");
            String type = (String) cam.get("type");

            try {
                // janusManager.ensureMountpoint(mountId, rtspUrl, rtspId, rtspPw);
                janusManager.ensureStream(mountId, vdieoPort, rtspUrl, rtspId, rtspPw, type);
            } catch (Exception e) {
                log.error("Mountpoint 생성 실패 mountpoint={} url={}", mountId, rtspUrl, e);
            }
        });

        log.info("CctvService: 초기화 완료");
    }

    public List<CctvEntity> getAllCCTVList() {
        return cctvRepository.findAll();
    }

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
            camera.put("rtspUrl", buildRtspUrl(entity));
            camera.put("type", entity.getType());
            camera.put("wsPort", parsePort(entity.getWsPort()));
            camera.put("locationCode", entity.getLocationCode());
            camera.put("latitude", entity.getLatitude());
            camera.put("longitude", entity.getLongitude());
            camera.put("status", entity.getStatusCam());
            camera.put("mountpointId", entity.getMountpointId());
            camera.put("videoPort", entity.getVideoPort());
            cameras.add(camera);
        }
        cameraCache.setCameras(cameras);
        return cameras;
    }

    private String buildRtspUrl(CctvEntity entity) {
        String base = "rtsp://";
        // if (entity.getRtspUrl() != null && !entity.getRtspUrl().isEmpty()) {
        // return base + entity.getRtspUrl();
        // } else {
        // return base;
        // }
        if (entity.getId() != null && !entity.getId().isEmpty()) {
            return base + entity.getId() + ":" + entity.getPassword() + "@" + entity.getRtspUrl();
        } else {
            return base + entity.getRtspUrl();
        }
    }

    private int parsePort(String wsPort) {
        try {
            return Integer.parseInt(wsPort);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    // 모든 카메라 정보 제공
    public List<Map<String, Object>> getAllCameras() {
        return cameraCache.getCameras();
    }

    private void refreshCache() {
        try {
            getCameras(); // 내부에서 cameraCache.setCameras(...)
        } catch (Exception ex) {
            log.error("camera cache refresh failed", ex);
        }
    }

    @Transactional
    public CctvEntity create(CctvCreateRequest req) {
        if (req.getCctvCode() == null || req.getCctvCode().isBlank()) {
            throw new IllegalArgumentException("cctvCode는 필수입니다.");
        }
        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("name은 필수입니다.");
        }

        cctvRepository.findByCctvCode(req.getCctvCode()).ifPresent(e -> {
            throw new IllegalArgumentException("이미 존재하는 cctvCode 입니다: " + req.getCctvCode());
        });

        CctvEntity e = new CctvEntity();
        e.setLocationCode(req.getLocationCode() != null ? req.getLocationCode() : req.getCctvCode());

        e.setCctvCode(req.getCctvCode());
        e.setName(req.getName());
        e.setRtspUrl(req.getRtspUrl());
        e.setLatitude(req.getLatitude());
        e.setLongitude(req.getLongitude());
        e.setId(req.getId());
        e.setPassword(req.getPassword());

        e.setMountpointId(req.getMountpointId());
        e.setVideoPort(req.getVideoPort());
        e.setAddress(req.getAddress());
        e.setType(req.getType());
        e.setWsPort(req.getWsPort());
        e.setStatusCam(req.getStatusCam());

        CctvEntity saved = cctvRepository.save(e);

        refreshCache();

        // mountpointId/videoPort/rtspUrl이 실제 스트림에 필요하면 켜는 것을 권장
        try {
            if (saved.getMountpointId() != null) {
                janusManager.ensureStream(
                        saved.getMountpointId(),
                        saved.getVideoPort(),
                        saved.getRtspUrl(),
                        saved.getId(),
                        saved.getPassword(),
                        saved.getType());
            }
        } catch (Exception ex) {
            log.error("ensureStream failed after create: cctvCode={}", saved.getCctvCode(), ex);
        }

        return saved;
    }

    // public CctvEntity updateByCctvCode(String cctvCode, CctvUpdateRequest req) {
    // CctvEntity e = cctvRepository.findByCctvCode(cctvCode)
    // .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " +
    // cctvCode));

    // e.setName(req.getName());
    // e.setMountpointId(req.getMountpointId());
    // e.setVideoPort(req.getVideoPort());
    // e.setAddress(req.getAddress());
    // e.setId(req.getId());
    // e.setPassword(req.getPassword());
    // e.setRtspUrl(req.getRtspUrl());
    // e.setType(req.getType());
    // e.setWsPort(req.getWsPort());
    // e.setLatitude(req.getLatitude());
    // e.setLongitude(req.getLongitude());

    // return e;
    // }

    @Transactional
    public CctvEntity updateByCctvCode(String cctvCode, CctvUpdateRequest req) {
        CctvEntity e = cctvRepository.findByCctvCode(cctvCode)
                .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " + cctvCode));

        e.setName(req.getName());
        e.setMountpointId(req.getMountpointId());
        e.setVideoPort(req.getVideoPort());
        e.setAddress(req.getAddress());
        e.setId(req.getId());

        // 비밀번호는 입력된 경우만 변경 권장
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            e.setPassword(req.getPassword());
        }

        e.setRtspUrl(req.getRtspUrl());
        e.setType(req.getType());
        e.setWsPort(req.getWsPort());
        e.setLatitude(req.getLatitude());
        e.setLongitude(req.getLongitude());

        CctvEntity saved = cctvRepository.save(e);

        refreshCache();

        return saved;
    }

    @Transactional
    public void deleteByCctvCode(String cctvCode) {
        if (!cctvRepository.existsByCctvCode(cctvCode)) {
            throw new IllegalArgumentException("CCTV not found: " + cctvCode);
        }
        cctvRepository.deleteByCctvCode(cctvCode);

        // 삭제 후 캐시 갱신(권장)
        refreshCache();
    }

}