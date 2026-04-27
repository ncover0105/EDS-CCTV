package com.edscorp.eds.speaker.secondary.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.speaker.secondary.domain.BroadcastListEntity;
import com.edscorp.eds.speaker.secondary.service.SpeakerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/broadcast")
@RequiredArgsConstructor
public class BroadcastController {
    private final SpeakerService speakerService;

    @GetMapping("/list")
    public List<BroadcastListEntity> getBroadcastList() {
        return speakerService.getBroadcastList();
    }

    @PostMapping("/add")
    public BroadcastListEntity add(@RequestBody BroadcastListEntity broadcastEntity) {
        return speakerService.add(broadcastEntity);
    }

    @PostMapping("/update")
    public BroadcastListEntity update(@RequestBody BroadcastListEntity broadcastEntity) {
        return speakerService.update(broadcastEntity);
    }

    @DeleteMapping("/delete/{code}")
    public void delete(@PathVariable("code") String code) {
        speakerService.delete(code);
    }
}
