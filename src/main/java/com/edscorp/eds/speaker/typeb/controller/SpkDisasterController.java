package com.edscorp.eds.speaker.typeb.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;
import com.edscorp.eds.speaker.typeb.dto.IdsReq;
import com.edscorp.eds.speaker.typeb.dto.SpkDisasterUpsertReq;
import com.edscorp.eds.speaker.typeb.service.SpkDisasterService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/disaster")
public class SpkDisasterController {
    private final SpkDisasterService spkDisasterService;

    /**
     * 전체 조회
     */
    @GetMapping
    public ResponseEntity<List<SpkDisaster>> getAll() {
        return ResponseEntity.ok(spkDisasterService.getAllDisasters());
    }

    /**
     * 단일 조회
     */
    @GetMapping("/{dstCode}")
    public ResponseEntity<SpkDisaster> getOne(@PathVariable String dstCode) {
        SpkDisaster found = spkDisasterService.getDisaster(dstCode);
        if (found == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(found);
    }

    /**
     * 사용중만 조회
     */
    @GetMapping("/active")
    public ResponseEntity<List<SpkDisaster>> getActive() {
        return ResponseEntity.ok(spkDisasterService.getActiveDisasters());
    }

    /**
     * 이름 검색
     */
    @GetMapping("/search")
    public ResponseEntity<List<SpkDisaster>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(spkDisasterService.searchDisasterByName(keyword));
    }

    /**
     * 생성
     * 현재 서비스 create()가 dstCode 정책 미구현이면 예외 발생
     */
    @PostMapping
    public ResponseEntity<SpkDisaster> create(@RequestBody SpkDisasterUpsertReq req) {
        SpkDisaster created = spkDisasterService.create(req);
        return ResponseEntity.ok(created);
    }

    /**
     * 수정 (모달 저장)
     */
    @PutMapping("/{dstCode}")
    public ResponseEntity<SpkDisaster> update(@PathVariable String dstCode,
            @RequestBody SpkDisasterUpsertReq req) {
        SpkDisaster updated = spkDisasterService.update(dstCode, req);
        return ResponseEntity.ok(updated);
    }

    /**
     * 삭제 이벤트(미사용 처리 / Soft Delete)
     * body: { "ids": ["001","002"] }
     */
    @PatchMapping("/deprecated")
    public ResponseEntity<Void> deprecated(@RequestBody IdsReq req) {
        spkDisasterService.deprecated(req.getIds());
        return ResponseEntity.noContent().build();
    }

    /**
     * 물리 삭제 (Hard Delete)
     * body: { "ids": ["001","002"] }
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteHard(@RequestBody IdsReq req) {
        spkDisasterService.deleteHard(req.getIds());
        return ResponseEntity.noContent().build();
    }

}
