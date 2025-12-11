package com.edscorp.eds.speaker.typeb.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.domain.SpkAlertDispatch;
import com.edscorp.eds.speaker.typeb.domain.SpkAlertHistory;
import com.edscorp.eds.speaker.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;
import com.edscorp.eds.speaker.typeb.domain.SpkSettingEntity;
import com.edscorp.eds.speaker.typeb.domain.SpkSystemConfigEntity;
import com.edscorp.eds.speaker.typeb.domain.SpkTestResultEntity;
import com.edscorp.eds.speaker.typeb.dto.SpkStatusResponse;
import com.edscorp.eds.speaker.typeb.dto.SpkAlertDispatchRequest;
import com.edscorp.eds.speaker.typeb.service.BTypeSpkService;
import com.edscorp.eds.speaker.typeb.service.SpkConfigService;
import com.edscorp.eds.speaker.typeb.service.SpkDisasterService;
import com.edscorp.eds.speaker.typeb.service.SpkSettingService;
import com.edscorp.eds.speaker.typeb.service.SpkSystemConfigService;
import com.edscorp.eds.speaker.typeb.service.SpkTestResultService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/btype/query")
public class BtypeQueryController {

    private final BTypeSpkService btypeSpkService;
    private final SpkConfigService spkConfigService;
    private final SpkDisasterService spkDisasterService;
    private final SpkSettingService spkSettingService;
    private final SpkSystemConfigService spkSystemConfigService;
    private final SpkTestResultService spkTestResultService;

    // ===================== 상태 조회 =====================

    // B 타입 스피커 상태 조회
    @GetMapping("/status/{speakerKey}")
    public ResponseEntity<SpkStatusResponse> getBtypeSpkStauts(
            @PathVariable Integer speakerKey) {

        SpkStatusResponse response = btypeSpkService.getBtypeSpkStauts(speakerKey);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    // ===================== 발령 이력 =====================

    // B 타입 발령 이력 조회 - alertKey 기준
    @GetMapping("/dispatch/alert/{alertKey}")
    public ResponseEntity<List<SpkAlertDispatch>> getDispatchHistoryByAlertKey(@PathVariable Integer alertKey) {
        // List<SpkAlertDispatch> dispatchHistory =
        // btypeSpkService.getDispatchHistoryByAlertKey(alertKey);
        return ResponseEntity.ok(btypeSpkService.getDispatchHistoryByAlertKey(alertKey));
    }

    // B 타입 발령 이력 조회 - deviceUid 기준
    @GetMapping("/dispatch/device/{deviceUid}")
    public ResponseEntity<List<SpkAlertDispatch>> getDispatchHistoryByDeviceUid(@PathVariable String deviceUid) {
        // List<SpkAlertDispatch> dispatchHistory =
        // btypeSpkService.getDispatchHistoryByDeviceUid(deviceUid);
        return ResponseEntity.ok(btypeSpkService.getDispatchHistoryByDeviceUid(deviceUid));
    }

    // B 타입 발령 생성
    @PostMapping("/dispatch")
    public ResponseEntity<SpkAlertDispatch> createDispatch(
            @RequestBody SpkAlertDispatchRequest request) {

        SpkAlertDispatch saved = btypeSpkService.createDispatch(request);
        return ResponseEntity.ok(saved);
    }

    // ===================== 발령 결과 이력 =====================

    // B 타입 발령 결과 조회 - 스피커 기준
    @GetMapping("/history/speaker/{speakerKey}")
    public ResponseEntity<List<SpkAlertHistory>> getBySpeakerKey(
            @PathVariable Integer speakerKey) {
        return ResponseEntity.ok(btypeSpkService.getHistoryBySpeakerKey(speakerKey));
    }

    // B 타입 발령 결과 조회 - 특정 alertHistKey 기준
    @GetMapping("/history/key/{alertHistKey}")
    public ResponseEntity<List<SpkAlertHistory>> getByAlertHistKey(
            @PathVariable Integer alertHistKey) {
        return ResponseEntity.ok(btypeSpkService.getHistoryByAlertHistKey(alertHistKey));
    }

    // ===================== 스피커 config 조회 =====================

    // 단일 스피커 설정 조회 (speakerKey 기준)
    // GET /api/btype/config/{speakerKey}
    @GetMapping("/config/{speakerKey}")
    public ResponseEntity<SpkConfig> getSpeakerConfig(@PathVariable Integer speakerKey) {
        SpkConfig config = spkConfigService.getSpeakerByKey(speakerKey);
        if (config == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(config);
    }

    // 지역 기준 스피커 목록 조회
    // GET /api/btype/config/location/{locationCode}
    @GetMapping("/config/location/{locationCode}")
    public ResponseEntity<List<SpkConfig>> getSpeakersByLocation(
            @PathVariable String locationCode) {

        return ResponseEntity.ok(spkConfigService.getSpeakersByLocation(locationCode));
    }

    // 미삭제(00) 스피커 목록
    // GET /api/btype/config/active
    @GetMapping("/config/active")
    public ResponseEntity<List<SpkConfig>> getActiveSpeakers() {
        return ResponseEntity.ok(spkConfigService.getActiveSpeakers());
    }

    // ===================== 재난 코드 조회 =====================

    // 전체 재난 코드
    @GetMapping("/disaster")
    public ResponseEntity<List<SpkDisaster>> getAllDisasterCodes() {
        return ResponseEntity.ok(spkDisasterService.getAllDisasters());
    }

    // 특정 재난 코드 조회
    @GetMapping("/disaster/{dstCode}")
    public ResponseEntity<SpkDisaster> getDisasterByCode(@PathVariable String dstCode) {
        SpkDisaster disaster = spkDisasterService.getDisaster(dstCode);
        if (disaster == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(disaster);
    }

    // 사용 가능한 재난 코드(Y)
    @GetMapping("/disaster/active")
    public ResponseEntity<List<SpkDisaster>> getActiveDisasters() {
        return ResponseEntity.ok(spkDisasterService.getActiveDisasters());
    }

    // 재난명 검색
    @GetMapping("/disaster/search")
    public ResponseEntity<List<SpkDisaster>> searchDisaster(@RequestParam String keyword) {
        return ResponseEntity.ok(spkDisasterService.searchDisasterByName(keyword));
    }

    // ===================== 스피커 설정 조회 =====================

    @GetMapping("/setting/{speakerKey}")
    public ResponseEntity<SpkSettingEntity> getSpeakerSetting(
            @PathVariable Integer speakerKey) {

        SpkSettingEntity setting = spkSettingService.getSetting(speakerKey);
        if (setting == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(setting);
    }

    // 설정 저장 (필요하다면)
    @PostMapping("/setting")
    public ResponseEntity<SpkSettingEntity> saveSpeakerSetting(
            @RequestBody SpkSettingEntity request) {

        SpkSettingEntity saved = spkSettingService.saveSetting(request);
        return ResponseEntity.ok(saved);
    }

    // ===================== 시스템 설정 =====================

    // 전체 설정 조회
    @GetMapping("/system/config")
    public ResponseEntity<List<SpkSystemConfigEntity>> getAllSystemConfigs() {
        return ResponseEntity.ok(spkSystemConfigService.getAllConfigs());
    }

    // 특정 설정 조회
    @GetMapping("/system/config/{key}")
    public ResponseEntity<SpkSystemConfigEntity> getSystemConfig(
            @PathVariable String key) {

        SpkSystemConfigEntity config = spkSystemConfigService.getConfig(key);
        if (config == null)
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok(config);
    }

    // 설정 저장/업데이트
    @PostMapping("/system/config")
    public ResponseEntity<SpkSystemConfigEntity> saveSystemConfig(
            @RequestBody SpkSystemConfigEntity request) {

        SpkSystemConfigEntity saved = spkSystemConfigService.saveConfig(request);
        return ResponseEntity.ok(saved);
    }

    // ===================== 스피커 시험 결과 조회 =====================

    // 스피커별 시험 결과 조회
    @GetMapping("/test-result/{speakerKey}")
    public ResponseEntity<List<SpkTestResultEntity>> getTestResults(
            @PathVariable Integer speakerKey) {

        return ResponseEntity.ok(spkTestResultService.getTestResults(speakerKey));
    }

    // 시험 결과 저장 (시험 완료 시)
    @PostMapping("/test-result")
    public ResponseEntity<SpkTestResultEntity> saveTestResult(
            @RequestBody SpkTestResultEntity request) {

        SpkTestResultEntity saved = spkTestResultService.saveTestResult(request);
        return ResponseEntity.ok(saved);
    }
}
