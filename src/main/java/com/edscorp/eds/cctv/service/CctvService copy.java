// package com.edscorp.eds.cctv.service;

// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;

// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import com.edscorp.eds.cctv.domain.CctvEntity;
// import com.edscorp.eds.cctv.dto.CctvCreateRequest;
// import com.edscorp.eds.cctv.dto.CctvUpdateRequest;
// import com.edscorp.eds.cctv.repository.CctvRepository;
// import com.edscorp.eds.cctv.stream.JanusApi;
// import com.edscorp.eds.cctv.stream.JanusManager;

// import jakarta.annotation.PostConstruct;
// import lombok.RequiredArgsConstructor;

// import org.springframework.scheduling.annotation.Async;
// import lombok.extern.slf4j.Slf4j;

// @Service
// @Slf4j
// @RequiredArgsConstructor
// public class CctvService {

// private final CctvRepository cctvRepository;
// private final CameraCache cameraCache;
// private final JanusManager janusManager;
// private final JanusApi janusApi;

// private final ConcurrentHashMap<Integer, JanusApi.JanusSession> janusSessions
// = new ConcurrentHashMap<>();

// // mountpointId 단위 락
// private final ConcurrentHashMap<Integer, Object> restartLocks = new
// ConcurrentHashMap<>();

// // mountpointId 단위 쿨다운(최근 재시작 시간)
// private final ConcurrentHashMap<Integer, Long> lastRestartAt = new
// ConcurrentHashMap<>();

// private static final long RESTART_COOLDOWN_MS = 30_000;

// private Object lockFor(Integer mountId) {
// return restartLocks.computeIfAbsent(mountId, k -> new Object());
// }

// private boolean isInCooldown(Integer mountId) {
// long now = System.currentTimeMillis();
// long last = lastRestartAt.getOrDefault(mountId, 0L);
// return (now - last) < RESTART_COOLDOWN_MS;
// }

// private void markRestart(Integer mountId) {
// lastRestartAt.put(mountId, System.currentTimeMillis());
// }

// @PostConstruct
// public void init() {

// log.info("CctvService: 초기화 시작");

// // Janus 연결 확인
// if (!janusApi.checkJanusConnection()) {
// log.error("Janus 연결 실패, Mountpoint 생성을 중단합니다.");
// getCameras();
// return;
// }

// // ensureAllStreamsAsync();
// log.info("CctvService: 초기화 완료");
// }

// @Async
// public void ensureAllStreamsAsync() {
// getCameras().forEach(cam -> {
// String locationCode = (String) cam.get("locationCode");
// String cctvCode = (String) cam.get("cctvCode");
// Integer mountId = (Integer) cam.get("mountpointId");
// Integer videoPort = (Integer) cam.get("videoPort");
// String rtspUrl = (String) cam.get("rtspUrl");
// String rtspId = (String) cam.get("id");
// String rtspPw = (String) cam.get("password");
// String type = (String) cam.get("type");

// if (mountId == null || videoPort == null || rtspUrl == null ||
// rtspUrl.isBlank())
// return;

// Object lock = lockFor(mountId);
// synchronized (lock) {
// try {
// janusManager.ensureStream(mountId, videoPort, rtspUrl, rtspId, rtspPw, type);
// if (locationCode != null && cctvCode != null)
// updateStatusProc(locationCode, cctvCode, 1);
// } catch (Exception e) {
// log.error("ensureStream failed mountpoint={} url={}", mountId, rtspUrl, e);
// if (locationCode != null && cctvCode != null)
// updateStatusProc(locationCode, cctvCode, 0);
// }
// }
// });
// }

// public List<CctvEntity> getAllCCTVList() {
// return cctvRepository.findAll();
// }

// public List<Map<String, Object>> getCameras() {
// log.info("getCameras() 카메라 리스트 캐싱 >>>>>>>>>>>");
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
// camera.put("type", entity.getType());
// camera.put("wsPort", parsePort(entity.getWsPort()));
// camera.put("locationCode", entity.getLocationCode());
// camera.put("latitude", entity.getLatitude());
// camera.put("longitude", entity.getLongitude());
// camera.put("status", entity.getStatusCam());
// camera.put("mountpointId", entity.getMountpointId());
// camera.put("videoPort", entity.getVideoPort());
// cameras.add(camera);
// }
// cameraCache.setCameras(cameras);
// return cameras;
// }

// private String buildRtspUrl(CctvEntity entity) {
// String raw = entity.getRtspUrl();
// if (raw == null)
// return "rtsp://";

// String base = raw.startsWith("rtsp://") ? raw.substring("rtsp://".length()) :
// raw;

// if (entity.getId() != null && !entity.getId().isEmpty()) {
// return "rtsp://" + entity.getId() + ":" + entity.getPassword() + "@" + base;
// } else {
// return "rtsp://" + base;
// }
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

// private void refreshCache() {
// try {
// getCameras(); // 내부에서 cameraCache.setCameras(...)
// } catch (Exception ex) {
// log.error("camera cache refresh failed", ex);
// }
// }

// @Transactional
// public CctvEntity create(CctvCreateRequest req) {
// if (req.getCctvCode() == null || req.getCctvCode().isBlank()) {
// throw new IllegalArgumentException("cctvCode는 필수입니다.");
// }
// if (req.getName() == null || req.getName().isBlank()) {
// throw new IllegalArgumentException("name은 필수입니다.");
// }

// // cctvRepository.findByCctvCode(req.getCctvCode()).ifPresent(e -> {
// // throw new IllegalArgumentException("이미 존재하는 cctvCode 입니다: " +
// // req.getCctvCode());
// // });

// String locationCode = (req.getLocationCode() != null &&
// !req.getLocationCode().isBlank())
// ? req.getLocationCode()
// : req.getCctvCode();

// if (cctvRepository.existsByLocationCodeAndCctvCode(locationCode,
// req.getCctvCode())) {
// throw new IllegalArgumentException("이미 존재하는 CCTV 입니다: " + locationCode + "/"
// + req.getCctvCode());
// }

// CctvEntity e = new CctvEntity();
// e.setLocationCode(req.getLocationCode() != null ? req.getLocationCode() :
// req.getCctvCode());

// e.setCctvCode(req.getCctvCode());
// e.setName(req.getName());
// e.setRtspUrl(req.getRtspUrl());
// e.setLatitude(req.getLatitude());
// e.setLongitude(req.getLongitude());
// e.setId(req.getId());
// e.setPassword(req.getPassword());

// e.setMountpointId(req.getMountpointId());
// e.setVideoPort(req.getVideoPort());
// e.setAddress(req.getAddress());
// e.setType(req.getType());
// e.setWsPort(req.getWsPort());
// e.setStatusCam(req.getStatusCam());

// CctvEntity saved = cctvRepository.save(e);

// refreshCache();

// // mountpointId/videoPort/rtspUrl이 실제 스트림에 필요하면 켜는 것을 권장
// try {
// if (saved.getMountpointId() != null) {
// // janusManager.ensureStream(
// // saved.getMountpointId(),
// // saved.getVideoPort(),
// // saved.getRtspUrl(),
// // saved.getId(),
// // saved.getPassword(),
// // saved.getType());
// String rtsp = buildRtspUrl(saved);

// janusManager.ensureStream(
// saved.getMountpointId(),
// saved.getVideoPort(),
// rtsp,
// saved.getId(),
// saved.getPassword(),
// saved.getType());

// }
// } catch (Exception ex) {
// log.error("ensureStream failed after create: cctvCode={}",
// saved.getCctvCode(), ex);
// }

// return saved;
// }

// @Async
// public void restartAsync(String locationCode, String cctvCode) {
// restart(locationCode, cctvCode, true);
// }

// @Async
// public void restartAllStreamsAsync() {
// restartAllStreams(false);
// }

// // CCTV 개별 재연결
// @Transactional(readOnly = true)
// public void restart(String locationCode, String cctvCode) {
// restart(locationCode, cctvCode, false);
// }

// @Transactional(readOnly = true)
// public void restart(String locationCode, String cctvCode, boolean force) {
// CctvEntity e = cctvRepository.findByLocationCodeAndCctvCode(locationCode,
// cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " +
// locationCode + "/" + cctvCode));

// Integer mountId = e.getMountpointId();
// Integer videoPort = e.getVideoPort();
// String rtspUrl = e.getRtspUrl();

// // init() 스킵 조건과 동일하게
// if (mountId == null || videoPort == null || rtspUrl == null ||
// rtspUrl.isBlank()) {
// throw new IllegalStateException("mountpointId/videoPort/rtspUrl이 없습니다. " +
// locationCode + "/" + cctvCode);
// }

// Object lock = lockFor(mountId);

// synchronized (lock) {
// // 쿨다운 (수동/관리자 force 요청이면 무시)
// if (!force && isInCooldown(mountId)) {
// log.info("restart skipped (cooldown) {} / {} mountId={}", locationCode,
// cctvCode, mountId);
// return;
// }

// String rtsp = buildRtspUrl(e);

// janusManager.restartStream(
// mountId,
// videoPort,
// rtsp,
// e.getId(),
// e.getPassword(),
// e.getType());

// markRestart(mountId);
// log.info("restart done {} / {} mountId={}", locationCode, cctvCode, mountId);
// }
// }

// // CCTV 전체 재연결
// @Async
// public void restartAllStreamsAsync(boolean force) {
// restartAllStreams(force);
// }

// @Transactional(readOnly = true)
// public void restartAllStreams(boolean force) {
// if (!janusApi.checkJanusConnection()) {
// throw new IllegalStateException("Janus 연결 실패 상태입니다.");
// }

// List<CctvEntity> all = cctvRepository.findAll();

// for (CctvEntity e : all) {
// Integer mountId = e.getMountpointId();
// Integer videoPort = e.getVideoPort();
// String rtspUrl = e.getRtspUrl();

// if (mountId == null || videoPort == null || rtspUrl == null ||
// rtspUrl.isBlank())
// continue;

// Object lock = lockFor(mountId);
// synchronized (lock) {

// // ✅ force=true면 쿨다운 무시
// if (!force && isInCooldown(mountId)) {
// log.info("restartAll skipped (cooldown) cctvCode={} mountId={}",
// e.getCctvCode(), mountId);
// continue;
// }

// String rtsp = buildRtspUrl(e);

// try {
// janusManager.restartStream(
// mountId,
// videoPort,
// rtsp,
// e.getId(),
// e.getPassword(),
// e.getType());

// markRestart(mountId);
// } catch (Exception ex) {
// log.error("restartAll failed cctvCode={} mountId={}", e.getCctvCode(),
// mountId, ex);
// }
// }
// }
// }

// @Transactional
// public void updateStatusCam(
// String locationCode,
// String cctvCode,
// int statusCam) {
// CctvEntity entity = cctvRepository
// .findByLocationCodeAndCctvCode(locationCode, cctvCode)
// .orElseThrow(() -> new IllegalArgumentException(
// "CCTV not found: " + locationCode + "/" + cctvCode));

// String newVal = String.valueOf(statusCam);

// if (!newVal.equals(entity.getStatusCam())) {
// entity.setStatusCam(newVal);
// }
// }

// @Transactional
// public CctvEntity update(String locationCode, String cctvCode,
// CctvUpdateRequest req) {
// CctvEntity e = cctvRepository.findByLocationCodeAndCctvCode(locationCode,
// cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " +
// locationCode + "/" + cctvCode));

// e.setName(req.getName());
// e.setMountpointId(req.getMountpointId());
// e.setVideoPort(req.getVideoPort());
// e.setAddress(req.getAddress());
// e.setId(req.getId());

// if (req.getPassword() != null && !req.getPassword().isBlank()) {
// e.setPassword(req.getPassword());
// }

// e.setRtspUrl(req.getRtspUrl());
// e.setType(req.getType());
// e.setWsPort(req.getWsPort());
// e.setLatitude(req.getLatitude());
// e.setLongitude(req.getLongitude());

// refreshCache();
// return e;
// }

// @Transactional
// public void updateStatusProc(String locationCode, String cctvCode, int
// statusProc) {
// CctvEntity entity = cctvRepository
// .findByLocationCodeAndCctvCode(locationCode, cctvCode)
// .orElseThrow(() -> new IllegalArgumentException(
// "CCTV not found: " + locationCode + "/" + cctvCode));

// String newVal = String.valueOf(statusProc);
// if (!newVal.equals(entity.getStatusProc())) {
// entity.setStatusProc(newVal);
// }
// }

// @Transactional
// public void delete(String locationCode, String cctvCode) {
// if (!cctvRepository.existsByLocationCodeAndCctvCode(locationCode, cctvCode))
// {
// throw new IllegalArgumentException("CCTV not found: " + locationCode + "/" +
// cctvCode);
// }
// cctvRepository.deleteByLocationCodeAndCctvCode(locationCode, cctvCode);
// refreshCache();
// }

// }