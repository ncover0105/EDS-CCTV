package com.edscorp.eds.speaker.typeb.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;
import com.edscorp.eds.speaker.typeb.repository.SpkDisasterRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpkDisasterService {
    private final SpkDisasterRepository disasterRepository;

    // 전체 조회
    public List<SpkDisaster> getAllDisasters() {
        return disasterRepository.findAll();
    }

    // 단일 조회
    public SpkDisaster getDisaster(String dstCode) {
        return disasterRepository.findById(dstCode).orElse(null);
    }

    // 사용 중인 재난 코드만 조회
    public List<SpkDisaster> getActiveDisasters() {
        return disasterRepository.findByDstUseFlag("Y");
    }

    // 검색 시
    public List<SpkDisaster> searchDisasterByName(String keyword) {
        return disasterRepository.findByDstNameContaining(keyword);
    }
}
