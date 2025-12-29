package com.edscorp.eds.cctv.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.dto.CctvUpdateRequest;
import com.edscorp.eds.cctv.service.CctvService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/cctv")
@RequiredArgsConstructor
public class CctvController {
    private final CctvService cctvService;

    @GetMapping("/list")
    public List<CctvEntity> getCctvList() {
        return cctvService.getAllCCTVList();
    }

    @PutMapping("/update/{cctvCode}")
    public ResponseEntity<CctvEntity> update(
            @PathVariable String cctvCode,
            @RequestBody CctvUpdateRequest req) {

        return ResponseEntity.ok(
                cctvService.updateByCctvCode(cctvCode, req));
    }

    @DeleteMapping("/delete/{cctvCode}")
    public ResponseEntity<Void> delete(@PathVariable String cctvCode) {
        cctvService.deleteByCctvCode(cctvCode);
        return ResponseEntity.ok().build();
    }

}
