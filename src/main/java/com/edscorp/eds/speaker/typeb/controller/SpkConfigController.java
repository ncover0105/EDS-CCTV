package com.edscorp.eds.speaker.typeb.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.dto.SpkConfigUpsertRequest;
import com.edscorp.eds.speaker.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.typeb.service.SpkConfigService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/btype/query/config/speaker")
public class SpkConfigController {
    private final SpkConfigService service;

    @PostMapping
    public ResponseEntity<SpkConfig> create(@RequestBody SpkConfigUpsertRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{speakerKey}")
    public ResponseEntity<SpkConfig> update(
            @PathVariable Integer speakerKey,
            @RequestBody SpkConfigUpsertRequest req) {
        return ResponseEntity.ok(service.update(speakerKey, req));
    }

    @DeleteMapping("/{speakerKey}")
    public ResponseEntity<Void> delete(@PathVariable Integer speakerKey) {
        service.deleteSoft(speakerKey, null);
        return ResponseEntity.noContent().build();
    }
}
