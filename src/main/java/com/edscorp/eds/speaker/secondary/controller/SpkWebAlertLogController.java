package com.edscorp.eds.speaker.secondary.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.secondary.dto.SpkWebAlertLogResponseDTO;
import com.edscorp.eds.speaker.secondary.dto.SpkWebAlertLogSearchRequest;
import com.edscorp.eds.speaker.secondary.service.SpkWebAlertLogQueryService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Slice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/spk/web/alert-logs")
public class SpkWebAlertLogController {
    private final SpkWebAlertLogQueryService queryService;

    // 내부 정책: 최신 3건
    @GetMapping("/latest")
    public List<SpkWebAlertLogResponseDTO> latest3(@ModelAttribute SpkWebAlertLogSearchRequest req) {
        return queryService.latest3(req);
    }

    // 전체 조회
    @GetMapping
    public Slice<SpkWebAlertLogResponseDTO> list(
            @ModelAttribute SpkWebAlertLogSearchRequest req,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return queryService.page(req, page, size);
    }

}
