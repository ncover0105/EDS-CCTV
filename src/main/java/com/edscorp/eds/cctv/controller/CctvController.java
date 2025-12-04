package com.edscorp.eds.cctv.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.service.CctvService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/cctv")
@RequiredArgsConstructor
public class CctvController {
    private final CctvService cctvService;

    @GetMapping("/list")
    public List<CctvEntity> getCctvList() {
        return cctvService.getAllCCTVList();
    }

}
