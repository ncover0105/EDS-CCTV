package com.edscorp.eds.cctv.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.edscorp.eds.cctv.domain.CctvEntity;
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
}
