package com.edscorp.eds.speaker.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.edscorp.eds.speaker.domain.SpeakerListEntity;
import com.edscorp.eds.speaker.service.SpeakerService;
import com.edscorp.eds.speaker.service.SpeakerSftpService;

import lombok.RequiredArgsConstructor;

import java.io.File;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/speaker")
@RequiredArgsConstructor
public class SpeakerController {

    private final SpeakerService speakerService;
    private final SpeakerSftpService sftpService;

    @GetMapping("/list")
    public List<SpeakerListEntity> getSpeakerList() {
        return speakerService.getSpeakerList();
    }

    // @GetMapping
    // public List<BroadcastEntity> getBroadcastList() {
    // return speakerService.getBroadcastList();
    // }

    // @PostMapping("/add")
    // public BroadcastEntity add(@RequestBody BroadcastEntity broadcastEntity) {
    // return speakerService.add(broadcastEntity);
    // }

    // @PostMapping("/update")
    // public BroadcastEntity update(@RequestBody BroadcastEntity broadcastEntity) {
    // return speakerService.update(broadcastEntity);
    // }

    @DeleteMapping("/delete/{code}")
    public void delete(@PathVariable String code) {
        speakerService.delete(code);
    }

    @PostMapping("/upload")
    @ResponseBody
    public ResponseEntity<String> uploadToSpeaker(
            @RequestParam("file") MultipartFile file,
            @RequestParam("host") String host,
            @RequestParam(name = "port", defaultValue = "22") int port,
            @RequestParam("user") String user,
            @RequestParam("password") String password) throws Exception {

        // 시스템 임시 디렉토리 경로 가져오기
        String tempDir = System.getProperty("java.io.tmpdir");

        // 업로드된 파일의 원래 이름 그대로 사용
        File tempFile = new File(tempDir, file.getOriginalFilename());

        // 파일 저장
        file.transferTo(tempFile);

        boolean result = sftpService.sendAudioFile(host, port, user, password, tempFile, "/upload");
        tempFile.delete();

        if (result) {
            return ResponseEntity.ok("스피커 음원 전송 완료!");
        } else {
            return ResponseEntity.internalServerError().body("❌ 음원 파일 전송 실패 (네트워크 또는 인증 오류)");
        }

    }
}