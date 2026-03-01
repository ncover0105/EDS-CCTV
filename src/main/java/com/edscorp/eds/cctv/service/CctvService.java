// package com.edscorp.eds.cctv.service;

// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;

// import org.springframework.scheduling.annotation.Async;
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
// import lombok.extern.slf4j.Slf4j;

// @Service
// @Slf4j
// @RequiredArgsConstructor
// public class CctvService {

// private final CctvRepository cctvRepository;
// private final CameraCache cameraCache;
// private final JanusManager janusManager;
// private final JanusApi janusApi;

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

// private boolean hasText(String s) {
// return s != null && !s.trim().isEmpty();
// }

// private String buildRtspUrlWithAuth(CctvEntity entity, String rawRtsp) {
// if (!hasText(rawRtsp))
// return "rtsp://";
// String base = rawRtsp.startsWith("rtsp://") ?
// rawRtsp.substring("rtsp://".length()) : rawRtsp;

// if (hasText(entity.getId())) {
// return "rtsp://" + entity.getId() + ":" + entity.getPassword() + "@" + base;
// }
// return "rtsp://" + base;
// }

// private int parsePort(String wsPort) {
// try {
// return Integer.parseInt(wsPort);
// } catch (NumberFormatException e) {
// return -1;
// }
// }

// @PostConstruct
// public void init() {
// log.info("CctvService: 초기화 시작");

// if (!janusApi.checkJanusConnection()) {
// log.error("Janus 연결 실패, Mountpoint 생성을 중단합니다.");
// getCameras();
// return;
// }

// // 필요하면 부팅 시 자동 ensure
// // ensureAllStreamsAsync();

// log.info("CctvService: 초기화 완료");
// }

// // ===================== ensure 공통 =====================
// private void ensureOne(String locationCode, String cctvCode,
// Integer mountId, Integer videoPort,
// String rtspUrl, String rtspId, String rtspPw, String type) {

// if (mountId == null || videoPort == null || !hasText(rtspUrl) ||
// "rtsp://".equals(rtspUrl)) {
// return;
// }

// Object lock = lockFor(mountId);
// synchronized (lock) {
// try {
// janusManager.ensureStream(mountId, videoPort, rtspUrl, rtspId, rtspPw, type);
// updateStatusProcIfPresent(locationCode, cctvCode, 1);
// markRestart(mountId);
// } catch (Exception e) {
// log.error("ensureStream failed mountpoint={} url={}", mountId, rtspUrl, e);
// updateStatusProcIfPresent(locationCode, cctvCode, 0);
// }
// }
// }

// private void ensureLowIfPresent(CctvEntity e) {
// if (!hasText(e.getLowRtspUrl()))
// return;
// if (e.getLowMountpointId() == null || e.getLowVideoPort() == null)
// return;

// String rtsp = buildRtspUrlWithAuth(e, e.getLowRtspUrl());
// ensureOne(e.getLocationCode(), e.getCctvCode(),
// e.getLowMountpointId(), e.getLowVideoPort(),
// rtsp, e.getId(), e.getPassword(), e.getType());
// }

// private void ensureHighIfPresent(CctvEntity e) {
// if (!hasText(e.getHighRtspUrl()))
// return;
// if (e.getHighMountpointId() == null || e.getHighVideoPort() == null)
// return;

// String rtsp = buildRtspUrlWithAuth(e, e.getHighRtspUrl());
// ensureOne(e.getLocationCode(), e.getCctvCode(),
// e.getHighMountpointId(), e.getHighVideoPort(),
// rtsp, e.getId(), e.getPassword(), e.getType());
// }

// private void ensureLegacyIfPresent(CctvEntity e) {
// // 레거시 호환: 기존 rtspUrl + mountpointId + videoPort
// if (!hasText(e.getRtspUrl()))
// return;
// if (e.getMountpointId() == null || e.getVideoPort() == null)
// return;

// String rtsp = buildRtspUrlWithAuth(e, e.getRtspUrl());
// ensureOne(e.getLocationCode(), e.getCctvCode(),
// e.getMountpointId(), e.getVideoPort(),
// rtsp, e.getId(), e.getPassword(), e.getType());
// }

// @Async
// public void ensureAllStreamsAsync() {
// // 캐시(Map) 기반 대신, 엔티티 기반으로 보장(필드 누락 방지)
// List<CctvEntity> all = cctvRepository.findAll();
// for (CctvEntity e : all) {
// ensureLowIfPresent(e);
// ensureHighIfPresent(e);
// // ensureLegacyIfPresent(e);
// }
// }

// // ===================== cameras cache =====================
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
// camera.put("type", entity.getType());
// camera.put("wsPort", parsePort(entity.getWsPort()));
// camera.put("locationCode", entity.getLocationCode());
// camera.put("latitude", entity.getLatitude());
// camera.put("longitude", entity.getLongitude());
// camera.put("status", entity.getStatusCam());

// // ✅ low/high가 있으면 같이 내려줌
// if (hasText(entity.getLowRtspUrl())) {
// camera.put("lowRtspUrl", buildRtspUrlWithAuth(entity,
// entity.getLowRtspUrl()));
// camera.put("lowMountpointId", entity.getLowMountpointId());
// camera.put("lowVideoPort", entity.getLowVideoPort());
// }
// if (hasText(entity.getHighRtspUrl())) {
// camera.put("highRtspUrl", buildRtspUrlWithAuth(entity,
// entity.getHighRtspUrl()));
// camera.put("highMountpointId", entity.getHighMountpointId());
// camera.put("highVideoPort", entity.getHighVideoPort());
// }

// // 레거시도 유지(기존 프론트/로직 호환)
// // if (hasText(entity.getRtspUrl())) {
// // camera.put("rtspUrl", buildRtspUrlWithAuth(entity, entity.getRtspUrl()));
// // camera.put("mountpointId", entity.getMountpointId());
// // camera.put("videoPort", entity.getVideoPort());
// // }

// cameras.add(camera);
// }
// cameraCache.setCameras(cameras);
// return cameras;
// }

// public List<Map<String, Object>> getAllCameras() {
// return cameraCache.getCameras();
// }

// private void refreshCache() {
// try {
// getCameras();
// } catch (Exception ex) {
// log.error("camera cache refresh failed", ex);
// }
// }

// public List<CctvEntity> getAllCCTVList() {
// return cctvRepository.findAll();
// }

// // ===================== CRUD =====================
// @Transactional
// public CctvEntity create(CctvCreateRequest req) {
// if (req.getCctvCode() == null || req.getCctvCode().isBlank()) {
// throw new IllegalArgumentException("cctvCode는 필수입니다.");
// }
// if (req.getName() == null || req.getName().isBlank()) {
// throw new IllegalArgumentException("name은 필수입니다.");
// }

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
// e.setLocationCode(locationCode);
// e.setCctvCode(req.getCctvCode());
// e.setName(req.getName());

// // 레거시
// e.setRtspUrl(req.getRtspUrl());
// e.setMountpointId(req.getMountpointId());
// e.setVideoPort(req.getVideoPort());

// // ✅ low/high
// e.setLowRtspUrl(req.getLowRtspUrl());
// e.setHighRtspUrl(req.getHighRtspUrl());
// e.setLowMountpointId(req.getLowMountpointId());
// e.setHighMountpointId(req.getHighMountpointId());
// e.setLowVideoPort(req.getLowVideoPort());
// e.setHighVideoPort(req.getHighVideoPort());

// e.setLatitude(req.getLatitude());
// e.setLongitude(req.getLongitude());
// e.setId(req.getId());
// e.setPassword(req.getPassword());
// e.setAddress(req.getAddress());
// e.setType(req.getType());
// e.setWsPort(req.getWsPort());
// e.setStatusCam(req.getStatusCam());

// CctvEntity saved = cctvRepository.save(e);
// refreshCache();

// // ✅ 있는 스트림만 Janus ensure
// try {
// ensureLowIfPresent(saved);
// ensureHighIfPresent(saved);
// // ensureLegacyIfPresent(saved);
// } catch (Exception ex) {
// log.error("ensureStream failed after create: cctvCode={}",
// saved.getCctvCode(), ex);
// updateStatusProcIfPresent(saved.getLocationCode(), saved.getCctvCode(), 0);
// }

// return saved;
// }

// @Transactional
// public CctvEntity update(String locationCode, String cctvCode,
// CctvUpdateRequest req) {
// CctvEntity e = cctvRepository.findByLocationCodeAndCctvCode(locationCode,
// cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " +
// locationCode + "/" + cctvCode));

// e.setName(req.getName());
// e.setAddress(req.getAddress());
// e.setId(req.getId());

// if (req.getPassword() != null && !req.getPassword().isBlank()) {
// e.setPassword(req.getPassword());
// }

// // 레거시
// e.setRtspUrl(req.getRtspUrl());
// e.setMountpointId(req.getMountpointId());
// e.setVideoPort(req.getVideoPort());

// // ✅ low/high
// e.setLowRtspUrl(req.getLowRtspUrl());
// e.setHighRtspUrl(req.getHighRtspUrl());
// e.setLowMountpointId(req.getLowMountpointId());
// e.setHighMountpointId(req.getHighMountpointId());
// e.setLowVideoPort(req.getLowVideoPort());
// e.setHighVideoPort(req.getHighVideoPort());

// e.setType(req.getType());
// e.setWsPort(req.getWsPort());
// e.setLatitude(req.getLatitude());
// e.setLongitude(req.getLongitude());

// refreshCache();
// return e;
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

// // ===================== restart =====================
// @Async
// public void restartAsync(String locationCode, String cctvCode) {
// restart(locationCode, cctvCode, true);
// }

// @Async
// public void restartAllStreamsAsync(boolean force) {
// restartAllStreams(force);
// }

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

// // ✅ low/high 각각 존재하면 각각 restart
// restartLowIfPresent(e, force);
// restartHighIfPresent(e, force);

// // 레거시도 유지
// // restartLegacyIfPresent(e, force);
// }

// private void restartLowIfPresent(CctvEntity e, boolean force) {
// if (!hasText(e.getLowRtspUrl()))
// return;
// if (e.getLowMountpointId() == null || e.getLowVideoPort() == null)
// return;

// Integer mountId = e.getLowMountpointId();
// Object lock = lockFor(mountId);

// synchronized (lock) {
// if (!force && isInCooldown(mountId))
// return;
// String rtsp = buildRtspUrlWithAuth(e, e.getLowRtspUrl());
// try {
// janusManager.restartStream(mountId, e.getLowVideoPort(), rtsp, e.getId(),
// e.getPassword(), e.getType());
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 1);
// markRestart(mountId);
// } catch (Exception ex) {
// log.error("restartStream failed (LOW) mountpoint={} url={}", mountId, rtsp,
// ex);
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 0);
// }
// }
// }

// private void restartHighIfPresent(CctvEntity e, boolean force) {
// if (!hasText(e.getHighRtspUrl()))
// return;
// if (e.getHighMountpointId() == null || e.getHighVideoPort() == null)
// return;

// Integer mountId = e.getHighMountpointId();
// Object lock = lockFor(mountId);

// synchronized (lock) {
// if (!force && isInCooldown(mountId))
// return;
// String rtsp = buildRtspUrlWithAuth(e, e.getHighRtspUrl());
// try {
// janusManager.restartStream(mountId, e.getHighVideoPort(), rtsp, e.getId(),
// e.getPassword(),
// e.getType());
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 1);
// markRestart(mountId);
// } catch (Exception ex) {
// log.error("restartStream failed (HIGH) mountpoint={} url={}", mountId, rtsp,
// ex);
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 0);
// }
// }
// }

// private void restartLegacyIfPresent(CctvEntity e, boolean force) {
// if (!hasText(e.getRtspUrl()))
// return;
// if (e.getMountpointId() == null || e.getVideoPort() == null)
// return;

// Integer mountId = e.getMountpointId();
// Object lock = lockFor(mountId);

// synchronized (lock) {
// if (!force && isInCooldown(mountId))
// return;
// String rtsp = buildRtspUrlWithAuth(e, e.getRtspUrl());
// try {
// janusManager.restartStream(mountId, e.getVideoPort(), rtsp, e.getId(),
// e.getPassword(), e.getType());
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 1);
// markRestart(mountId);
// } catch (Exception ex) {
// log.error("restartStream failed (LEGACY) mountpoint={} url={}", mountId,
// rtsp, ex);
// updateStatusProcIfPresent(e.getLocationCode(), e.getCctvCode(), 0);
// }
// }
// }

// @Transactional(readOnly = true)
// public void restartAllStreams(boolean force) {
// List<CctvEntity> all = cctvRepository.findAll();
// for (CctvEntity e : all) {
// restart(e.getLocationCode(), e.getCctvCode(), force);
// }
// }

// // ===================== statusProc =====================
// @Transactional
// public void updateStatusProc(String locationCode, String cctvCode, int
// statusProc) {
// CctvEntity entity = cctvRepository
// .findByLocationCodeAndCctvCode(locationCode, cctvCode)
// .orElseThrow(() -> new IllegalArgumentException("CCTV not found: " +
// locationCode + "/" + cctvCode));

// String newVal = String.valueOf(statusProc);
// if (!newVal.equals(entity.getStatusProc())) {
// entity.setStatusProc(newVal);
// }
// }

// private void updateStatusProcIfPresent(String locationCode, String cctvCode,
// int statusProc) {
// if (!hasText(locationCode) || !hasText(cctvCode))
// return;
// updateStatusProc(locationCode, cctvCode, statusProc);
// }

// @Transactional
// public void updateStatusCam(String locationCode, String cctvCode, int
// statusCam) {
// CctvEntity entity = cctvRepository
// .findByLocationCodeAndCctvCode(locationCode, cctvCode)
// .orElseThrow(() -> new IllegalArgumentException(
// "CCTV not found: " + locationCode + "/" + cctvCode));

// String newVal = String.valueOf(statusCam);
// if (!newVal.equals(entity.getStatusCam())) {
// entity.setStatusCam(newVal);
// }
// }
// }