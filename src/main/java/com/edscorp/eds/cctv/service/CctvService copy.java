// package com.edscorp.eds.service;

// import java.io.IOException;
// import java.net.URLEncoder;
// import java.nio.charset.StandardCharsets;
// import java.time.Instant;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.Set;
// import java.util.concurrent.ConcurrentHashMap;
// import java.util.stream.Collectors;

// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import com.edscorp.eds.model.CameraCache;
// import com.edscorp.eds.model.entity.CctvEntity;
// import com.edscorp.eds.repository.CctvRepository;

// import jakarta.annotation.PostConstruct;
// import lombok.RequiredArgsConstructor;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.scheduling.TaskScheduler;
// import org.springframework.scheduling.annotation.EnableAsync;
// import lombok.extern.slf4j.Slf4j;

// @Service
// @Slf4j
// @RequiredArgsConstructor
// @EnableAsync
// public class CctvService {
    
//     private final CctvRepository cctvRepository;
//     private final CameraCache cameraCache;
//     // private final JanusManager janusManager;
//     private final GstProcessManager gstProcessManager;
//     private final TaskScheduler scheduler;
//     private final JanusService janusService;

//     // private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions = new ConcurrentHashMap<>();

//     private final ConcurrentHashMap<String, Integer> cctvPortMap = new ConcurrentHashMap<>();

//     // properties에서 값 주입
//     @Value("${janus.public.url")
//     private String janusHost;

//     @Value("${gstreamer.video-port-start}")
//     private int portStart;
    
//     @Value("${gstreamer.video-port-end}")
//     private int portEnd;

//     /**
//      * 애플리케이션 시작 시 포트 할당
//      */
//     @PostConstruct
//     public void initializePorts() {
//         log.info("CCTV 포트 초기화 시작");

//         List<CctvEntity> cameras = cctvRepository.findByStatusCam("0");
//         for (CctvEntity camera : cameras) {
//             // videoPort가 null 혹은 0인 경우에만 할당
//             if (camera.getVideoPort() == null || camera.getVideoPort() == 0) {
//                 int assignedPort = assignAvailablePort();
//                 if (assignedPort != -1) {
//                     camera.setVideoPort(assignedPort);
//                     cctvRepository.save(camera);
//                     log.info("포트 자동 할당: {} -> {}", camera.getCctvCode(), assignedPort);
//                 } else {
//                     log.error("사용 가능한 포트를 찾지 못함: {}", camera.getCctvCode());
//                 }
//             }

//             // 할당된 포트가 있으면 자동으로 스트리밍 시작
//             Integer port = camera.getVideoPort();
//             if (port != null && port > 0) {
//                 boolean started = start(camera.getCctvCode());
//                 log.info("자동 스트리밍 시작 ({}): {}", camera.getCctvCode(), started ? "성공" : "실패");
//             }
//         }

//         log.info("CCTV 포트 초기화 완료");
//     }

//     /**
//      * 사용 가능한 포트를 범위 내에서 찾음
//      */
//     private int assignAvailablePort() {
//         Set<Integer> usedPorts = cctvRepository.findAll().stream()
//             .map(CctvEntity::getVideoPort)
//             .filter(p -> p != null && p > 0)
//             .collect(Collectors.toSet());

//         for (int port = portStart; port <= portEnd; port++) {
//             if (!usedPorts.contains(port)) {
//                 return port;
//             }
//         }
//         return -1;
//     }

//     /**
//      * 특정 CCTV 스트리밍 시작
//      */
//     @Transactional
//     public boolean start(String cctvCode) {
//         try {
//             CctvEntity cctv = cctvRepository.findByCctvCode(cctvCode)
//                 .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " + cctvCode));

//             int videoPort = cctv.getVideoPort();
//             if (videoPort == 0) {
//                 log.error("Invalid videoPort for {}: {}", cctvCode, videoPort);
//                 return false;
//             }

//             // ① 먼저 Janus에 RTP 스트림 등록
//             String janusResult = janusService.createRtpStream(cctv.getMountpointId(), cctv.getName(), videoPort, 96, "H264/90000");
//             if (janusResult == null || !isJanusSuccess(janusResult)) {
//                 log.error("Janus RTP 스트림 등록 실패: {}", cctvCode);
//                 return false;
//             }

//             // ② 잠시 대기 (Janus가 포트 바인딩할 시간 제공)
//             Thread.sleep(1000);

//             // ③ GStreamer 시작
//             boolean gstStarted = gstProcessManager.start(cctvCode, cctv.getRtspUrl(), videoPort);
//             if (!gstStarted) {
//                 log.error("GStreamer 시작 실패: {}", cctvCode);
//                 // Janus 스트림 정리
//                 janusService.destroyRtpStream(videoPort);
//                 return false;
//             }

//             log.info("스트리밍 시작 성공: {} -> 포트 {}", cctvCode, videoPort);
//             return true;

//             // // 1) GStreamer 시작
//             // boolean gstStarted = gstProcessManager.start(cctvCode, cctv.getRtspUrl(), videoPort);
//             // if (!gstStarted) {
//             //     log.error("GStreamer 시작 실패: {}", cctvCode);
//             //     return false;
//             // }

//             // // 2) Janus에 RTP 스트림 등록 (videoPort를 ID로 사용)
//             // janusService.createRtpStream(videoPort, cctv.getName(), videoPort, 96, "H264/90000");
//             // log.info("Janus RTP 스트림 등록 완료: {} -> 포트 {}", cctvCode, videoPort);

//             // return true;
//         } catch (Exception e) {
//             log.error("스트리밍 시작 실패: {}", cctvCode, e);
//             return false;
//         }
//     }

//     // Janus 응답 성공 여부 확인 메서드 추가 필요
//     private boolean isJanusSuccess(String response) {
//         // JSON 파싱해서 "janus": "success" 또는 "ack" 확인
//         return response != null && (response.contains("\"janus\":\"success\"") || response.contains("\"janus\":\"ack\""));
//     }

//     /**
//      * CCTV 스트리밍 중지
//      */    
//     @Transactional
//     public boolean stop(String cctvCode) {
//         try {
//             CctvEntity cctv = cctvRepository.findByCctvCode(cctvCode)
//                 .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " + cctvCode));
            
//             // 1) GStreamer 프로세스 중지
//             gstProcessManager.stop(cctvCode);
            
//             // 2) Janus RTP 스트림 제거
//             if (cctv.getVideoPort() != null) {
//                 try {
//                     janusService.destroyRtpStream(cctv.getVideoPort());
//                     log.info("Janus RTP 스트림 제거 완료: {}", cctvCode);
//                 } catch (Exception e) {
//                     log.error("Janus RTP 스트림 제거 실패: {}", cctvCode, e);
//                 }
//             }
            
//             log.info("CCTV 스트리밍 중지 완료: {}", cctvCode);
//             return true;
            
//         } catch (Exception e) {
//             log.error("CCTV 스트리밍 중지 실패: {}", cctvCode, e);
//             return false;
//         }
//     }

//     /**
//      * 모든 카메라 재시작
//      */
//     public void restartAll() {
//         log.info("모든 카메라 재시작 시작");
        
//         // 모든 프로세스 중지
//         gstProcessManager.stopAll();
        
//         // 활성 카메라 다시 시작
//         List<CctvEntity> activeCameras = cctvRepository.findByStatusCam("0");
//         for (CctvEntity camera : activeCameras) {
//             try {
//                 Thread.sleep(1000); // 시작 간격 조정
//                 start(camera.getCctvCode());
//             } catch (Exception e) {
//                 log.error("카메라 재시작 실패: {}", camera.getCctvCode(), e);
//             }
//         }
        
//         log.info("모든 카메라 재시작 완료");
//     }

//     /**
//      * CCTV 스트리밍 상태 확인
//      */
//     public boolean isRunning(String cctvCode) {
//         return gstProcessManager.isRunning(cctvCode);
//     }
    
//     /**
//      * 특정 CCTV에 할당된 포트 조회
//      */
//     public Integer getAssignedPort(String cctvCode) {
//         return cctvPortMap.get(cctvCode);
//     }

//     /**
//      * 모든 CCTV 목록 반환
//      */
//     public List<CctvEntity> getAllCCTVList() {
//         return cctvRepository.findAll();
//     }

//     public List<Map<String, Object>> getCameras() {
//         List<CctvEntity> entityList = cctvRepository.findAll();
//         List<Map<String, Object>> cameras = new ArrayList<>();

//         for (CctvEntity entity : entityList) {
//             Map<String, Object> camera = new HashMap<>();
//             camera.put("name", entity.getName());
//             camera.put("cctvCode", entity.getCctvCode());
//             camera.put("address", entity.getAddress());
//             camera.put("id", entity.getId());
//             camera.put("password", entity.getPassword());
//             camera.put("rtspUrl", buildRtspUrl(entity));
//             camera.put("wsPort", parsePort(entity.getWsPort()));
//             camera.put("locationCode", entity.getLocationCode());
//             camera.put("latitude", entity.getLatitude());
//             camera.put("longitude", entity.getLongitude());
//             camera.put("status", entity.getStatusCam());
//             camera.put("mountpointId", entity.getMountpointId());
//             camera.put("videoPort", entity.getVideoPort());
//             cameras.add(camera);
//         }
//         cameraCache.setCameras(cameras);
//         return cameras;
//     }

//     private String buildRtspUrl(CctvEntity entity) {
//         String base = "rtsp://";
//         if (entity.getRtspUrl() != null && !entity.getRtspUrl().isEmpty()) {

//             return base + entity.getRtspUrl();
//         } else {
//             return base;
//         }
//         // String id = entity.getId();
//         // String pw = entity.getPassword();

//         // String encodedId = URLEncoder.encode(id, StandardCharsets.UTF_8);
//         // String endcodedPw = URLEncoder.encode(pw, StandardCharsets.UTF_8);

//         // String url = entity.getRtspUrl();

//         // String rtspURL = String.format("rtsp://%s:%s@%s", encodedId, endcodedPw, url);

//         // log.info("✅ rtspURL {} 생성 완료", rtspURL);

//         // return rtspURL;
//         // if (entity.getId() != null && !entity.getId().isEmpty()) {
//         //     return base + entity.getId() + ":" + entity.getPassword() + "@" + entity.getRtspUrl();
//         // } else {
//         //     return base + entity.getRtspUrl();
//         // }
//     }

//     private int parsePort(String wsPort) {
//         try {
//             return Integer.parseInt(wsPort);
//         } catch (NumberFormatException e) {
//             return -1;
//         }
//     }

//     // 모든 카메라 정보 제공
//     public List<Map<String, Object>> getAllCameras() {
//         return cameraCache.getCameras();
//     }
// }
