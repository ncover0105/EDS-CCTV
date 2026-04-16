package com.edscorp.eds.tts.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.tts.dto.TtsResponse;
import com.edscorp.eds.tts.dto.TtsUpsertRequest;
import com.edscorp.eds.tts.service.TtsListService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tts")
public class TtsListController {

    private final TtsListService ttsListService;

    // GET /api/tts?page=0&size=20
    @GetMapping
    public Page<TtsResponse> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ttsListService.list(page, size);
    }

    // GET /api/tts/{id}
    @GetMapping("/{id}")
    public TtsResponse get(@PathVariable("id") Long id) {
        return ttsListService.get(id);
    }

    // POST /api/tts
    @PostMapping
    public ResponseEntity<TtsResponse> create(@RequestBody TtsUpsertRequest req) {
        TtsResponse created = ttsListService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/tts/{id}
    @PutMapping("/{id}")
    public TtsResponse update(
            @PathVariable("id") Long id,
            @RequestBody TtsUpsertRequest req) {
        return ttsListService.update(id, req);
    }

    // DELETE /api/tts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        ttsListService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
