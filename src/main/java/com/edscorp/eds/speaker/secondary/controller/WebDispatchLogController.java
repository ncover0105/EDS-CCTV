package com.edscorp.eds.speaker.secondary.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.secondary.dto.WebDispatchLogRequest;
import com.edscorp.eds.speaker.secondary.dto.WebSpkDispatchLogRow;
import com.edscorp.eds.speaker.secondary.service.WebDispatchLogService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/web/dispatch")
public class WebDispatchLogController {
    private final WebDispatchLogService logService;

    @PostMapping("/log")
    public ResponseEntity<?> write(@RequestBody WebDispatchLogRequest body,
            HttpServletRequest request,
            Principal principal) {

        String userId = (principal != null) ? principal.getName() : null;
        String ip = extractClientIp(request);
        String ua = request.getHeader("User-Agent");

        Long logKey = logService.writeLog(body, userId, ip, ua);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "logKey", logKey));
    }

    @GetMapping("/loglist")
    public ResponseEntity<?> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,

            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String speakerQ,
            @RequestParam(required = false) String messageQ,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        LocalDateTime now = LocalDateTime.now();

        // 오늘 00:00
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

        // 기본값: 오늘 00:00 ~ 현재
        LocalDateTime safeStart = (start != null) ? start : todayStart;
        LocalDateTime safeEnd = (end != null) ? end : now;

        Page<WebSpkDispatchLogRow> result = logService.search(
                safeStart,
                safeEnd,
                mode,
                priority,
                speakerQ,
                messageQ,
                page,
                size);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "items", result.getContent()));
    }

    private String extractClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank())
            return xff.split(",")[0].trim();

        String xrip = req.getHeader("X-Real-IP");
        if (xrip != null && !xrip.isBlank())
            return xrip.trim();

        return req.getRemoteAddr();
    }
}
