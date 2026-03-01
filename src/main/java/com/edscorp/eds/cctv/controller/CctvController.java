package com.edscorp.eds.cctv.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.dto.CctvCreateRequest;
import com.edscorp.eds.cctv.dto.CctvUpdateRequest;
import com.edscorp.eds.cctv.service.CctvManagementService;
import com.edscorp.eds.cctv.service.CctvStreamService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/cctv")
@RequiredArgsConstructor
public class CctvController {

    private final CctvManagementService cctvManagementService; // ✅ CRUD 담당
    private final CctvStreamService cctvStreamService; // ✅ 스트림 담당

    // ===================== CCTV 데이터 관리 =====================
    @GetMapping("/list")
    public List<CctvEntity> getCctvList() {
        return cctvManagementService.getAllCCTVList();
    }

    @PostMapping("/add")
    public ResponseEntity<CctvEntity> add(@RequestBody CctvCreateRequest req) {
        return ResponseEntity.ok(cctvManagementService.create(req));
    }

    @PutMapping("/{locationCode}/{cctvCode}")
    public ResponseEntity<CctvEntity> update(
            @PathVariable("locationCode") String locationCode,
            @PathVariable("cctvCode") String cctvCode,
            @RequestBody CctvUpdateRequest req) {
        return ResponseEntity.ok(cctvManagementService.update(locationCode, cctvCode, req));
    }

    @DeleteMapping("/{locationCode}/{cctvCode}")
    public ResponseEntity<Void> delete(
            @PathVariable("locationCode") String locationCode,
            @PathVariable("cctvCode") String cctvCode) {
        cctvManagementService.delete(locationCode, cctvCode);
        return ResponseEntity.ok().build();
    }

    // ===================== 스트림 관리 =====================
    @PostMapping("/stream/restart-all")
    public ResponseEntity<Void> restartAll() {
        cctvStreamService.restartAllStreamsAsync(true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/stream/{locationCode}/{cctvCode}/restart")
    public ResponseEntity<Void> restartOne(
            @PathVariable("locationCode") String locationCode,
            @PathVariable("cctvCode") String cctvCode) {
        cctvStreamService.restartAsync(locationCode, cctvCode);
        return ResponseEntity.ok().build();
    }

    // ===================== 상태 관리 =====================
    @PostMapping("/status")
    public ResponseEntity<Void> updateStatus(
            @RequestParam("locationCode") String locationCode,
            @RequestParam("cctvCode") String cctvCode,
            @RequestParam("statusCam") int statusCam) {
        if (statusCam != 0 && statusCam != 1) {
            return ResponseEntity.badRequest().build();
        }
        cctvManagementService.updateStatusCam(locationCode, cctvCode, statusCam);
        return ResponseEntity.ok().build();
    }
}