// package com.edscorp.eds.service;

// import java.io.IOException;
// import java.net.URLEncoder;
// import java.nio.charset.StandardCharsets;
// import java.time.Instant;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;

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

// private final CctvRepository cctvRepository;
// private final CameraCache cameraCache;
// private final JanusManager janusManager;
// private final GstProcessManager gstProcessManager;
// private final TaskScheduler scheduler;
// private final JanusService janusService;

// private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions
// = new ConcurrentHashMap<>();

// private final ConcurrentHashMap<String, Integer> cctvPortMap = new
// ConcurrentHashMap<>();

// // properties에서 값 주입
// @Value("${janus.public.url")
// private String janusHost;

// @PostConstruct
// public void init() {
// log.info("CctvService: 초기화 시작");

// // getCameras().forEach(cam -> {
// // Integer mountId = (Integer) cam.get("mountpointId");
// // String rtspUrl = (String) cam.get("rtspUrl");
// // String rtspId = (String) cam.get("id");
// // String rtspPw = (String) cam.get("password");
// // try {
// // janusManager.ensureMountpoint(mountId, rtspUrl, rtspId, rtspPw);
// // } catch (Exception e) {
// // log.error("Mountpoint 생성 실패 mountpoint={} url={}", mountId, rtspUrl, e);
// // }
// // });

// try {
// // Gstreamer 포트 풀 초기화
// gstProcessManager.initPortPool();

// // 기존 카메라 정보로 Janus 마운트 포인트 생성
// initializeJanusMountpoints();

// // 모든 활성 카메라 자동 시작

// log.info("CctvService: 초기화 완료");

// } catch (Exception e) {
// log.error("CctvService 초기화 실패", e);
// }

// }

// /**
// * Janus 마운트포인트 초기화
// */
// private void initializeJanusMountpoints() {
// getCameras().forEach(cam -> {
// try {
// Integer mountId = (Integer) cam.get("mountpointId");
// String rtspUrl = (String) cam.get("rtspUrl");
// String rtspId = (String) cam.get("id");
// String rtspPw = (String) cam.get("password");

// if (mountId != null && rtspUrl != null) {
// janusManager.ensureMountpoint(mountId, rtspUrl, rtspId, rtspPw);
// log.debug("Janus 마운트포인트 생성: {} -> {}", mountId, rtspUrl);
// }

// } catch (Exception e) {
// log.error("마운트포인트 생성 실패: {}", cam.get("cctvCode"), e);
// }
// });
// }

// /**
// * 모든 활성 카메라 자동 시작
// */
// private void startAllActiveCameras() {
// List<CctvEntity> activeCctvs = cctvRepository.findByStatusCam("0");

// log.info("활성 카메라 {}대 자동 시작", activeCctvs.size());

// for (CctvEntity cctv : activeCctvs) {
// try {
// // 카메라 간 시작 간격 조정 (시스템 부하 분산)
// Thread.sleep(2000);
// start(cctv.getCctvCode());

// } catch (Exception e) {
// log.error("카메라 자동 시작 실패: {}", cctv.getCctvCode(), e);
// }
// }
// }

// /**
// * 특정 CCTV 스트리밍 시작
// */
// @Transactional
// public boolean start(String cctvCode) {
// try {
// CctvEntity cctv = cctvRepository.findByCctvCode(cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV를 찾을 수 없습니다: " +
// cctvCode));

// log.info("CCTV 스트리밍 시작: {} ({})", cctv.getName(), cctvCode);

// // 1) GStreamer 프로세스 시작 (포트는 GstProcessManager가 할당)
// int videoPort = gstProcessManager.startProcess(cctvCode, cctv.getRtspUrl());

// if (videoPort == -1) {
// log.error("GStreamer 프로세스 시작 실패: {}", cctvCode);
// return false;
// }

// // 포트 매핑 저장
// cctvPortMap.put(cctvCode, videoPort);

// // 2) Janus RTP 스트림 등록
// if (cctv.getMountpointId() != null) {
// try {
// janusService.createRtpStream(
// cctv.getMountpointId(),
// cctv.getName(),
// videoPort,
// 96,
// "H264/90000"
// );
// log.debug("Janus RTP 스트림 등록: {} -> 포트: {}",
// cctv.getMountpointId(), videoPort);
// } catch (Exception e) {
// log.error("Janus RTP 스트림 등록 실패: {}", cctvCode, e);
// // GStreamer 프로세스는 계속 실행
// }
// }

// // 3) 10초 후 상태 확인 후 자동 재시작 설정
// scheduler.schedule(() -> monitorCameraHealth(cctvCode),
// Instant.now().plusSeconds(10));

// log.info("CCTV 스트리밍 시작 완료: {} -> 포트: {}", cctvCode, videoPort);
// return true;

// } catch (Exception e) {
// log.error("CCTV 스트리밍 시작 실패: {}", cctvCode, e);
// return false;
// }
// }

// /**
// * 카메라 상태 모니터링
// */
// private void monitorCameraHealth(String cctvCode) {
// if (!isRunning(cctvCode)) {
// log.warn("카메라 상태 이상 감지, 재시작 시도: {}", cctvCode);
// try {
// start(cctvCode);
// } catch (Exception e) {
// log.error("카메라 자동 재시작 실패: {}", cctvCode, e);
// }
// }
// }

// /**
// * CCTV 스트리밍 중지
// */
// @Transactional
// public boolean stop(String cctvCode) {
// try {
// CctvEntity cctv = cctvRepository.findByCctvCode(cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV를 찾을 수 없습니다: " +
// cctvCode));

// log.info("CCTV 스트리밍 중지: {} ({})", cctv.getName(), cctvCode);

// // 1) GStreamer 프로세스 중지
// boolean gstStopped = gstProcessManager.stopProcess(cctvCode);

// // 2) Janus RTP 스트림 제거
// if (cctv.getMountpointId() != null) {
// try {
// janusService.destroyRtpStream(cctv.getMountpointId());
// log.debug("Janus RTP 스트림 제거: {}", cctv.getMountpointId());
// } catch (Exception e) {
// log.error("Janus RTP 스트림 제거 실패: {}", cctvCode, e);
// }
// }

// // 포트 매핑 제거
// cctvPortMap.remove(cctvCode);

// log.info("CCTV 스트리밍 중지 완료: {}", cctvCode);
// return gstStopped;

// } catch (Exception e) {
// log.error("CCTV 스트리밍 중지 실패: {}", cctvCode, e);
// return false;
// }
// }

// /**
// * 모든 카메라 재시작
// */
// public void restartAll() {
// log.info("모든 카메라 재시작 시작");

// // 1) 모든 프로세스 중지
// gstProcessManager.stopAllProcesses();

// // 포트 매핑 초기화
// cctvPortMap.clear();

// try {
// // 2) 잠시 대기
// Thread.sleep(5000);

// // 3) 모든 활성 카메라 재시작
// startAllActiveCameras();

// } catch (InterruptedException e) {
// Thread.currentThread().interrupt();
// log.error("재시작 중 인터럽트 발생", e);
// }

// log.info("모든 카메라 재시작 완료");
// }

// /**
// * CCTV 스트리밍 상태 확인
// */
// public boolean isRunning(String cctvCode) {
// return gstProcessManager.isProcessRunning(cctvCode);
// }

// /**
// * 특정 CCTV에 할당된 포트 조회
// */
// public Integer getAssignedPort(String cctvCode) {
// return cctvPortMap.get(cctvCode);
// }

// /**
// * 모든 CCTV 목록 반환
// */
// public List<CctvEntity> getAllCCTVList() {
// return cctvRepository.findAll();
// }

// public List<Map<String, Object>> getCameras() {
// List<CctvEntity> entityList = cctvRepository.findAll();
// List<Map<String, Object>> cameras = new ArrayList<>();

// for (CctvEntity entity : entityList) {
// Map<String, Object> camera = new HashMap<>();
// camera.put("name", entity.getName());
// camera.put("cctvCode", entity.getCctvCode());
// camera.put("address", entity.getAddress());
// camera.put("id", entity.getId());
// camera.put("password", entity.getPassword());
// camera.put("rtspUrl", buildRtspUrl(entity));
// camera.put("wsPort", parsePort(entity.getWsPort()));
// camera.put("locationCode", entity.getLocationCode());
// camera.put("latitude", entity.getLatitude());
// camera.put("longitude", entity.getLongitude());
// camera.put("status", entity.getStatusCam());
// camera.put("mountpointId", entity.getMountpointId());
// cameras.add(camera);
// }
// cameraCache.setCameras(cameras);
// return cameras;
// }

// private String buildRtspUrl(CctvEntity entity) {
// String base = "rtsp://";
// if (entity.getRtspUrl() != null && !entity.getRtspUrl().isEmpty()) {

// return base + entity.getRtspUrl();
// } else {
// return base;
// }
// // String id = entity.getId();
// // String pw = entity.getPassword();

// // String encodedId = URLEncoder.encode(id, StandardCharsets.UTF_8);
// // String endcodedPw = URLEncoder.encode(pw, StandardCharsets.UTF_8);

// // String url = entity.getRtspUrl();

// // String rtspURL = String.format("rtsp://%s:%s@%s", encodedId, endcodedPw,
// url);

// // log.info("✅ rtspURL {} 생성 완료", rtspURL);

// // return rtspURL;
// // if (entity.getId() != null && !entity.getId().isEmpty()) {
// // return base + entity.getId() + ":" + entity.getPassword() + "@" +
// entity.getRtspUrl();
// // } else {
// // return base + entity.getRtspUrl();
// // }
// }

// private int parsePort(String wsPort) {
// try {
// return Integer.parseInt(wsPort);
// } catch (NumberFormatException e) {
// return -1;
// }
// }

// // 모든 카메라 정보 제공
// public List<Map<String, Object>> getAllCameras() {
// return cameraCache.getCameras();
// }
// }
