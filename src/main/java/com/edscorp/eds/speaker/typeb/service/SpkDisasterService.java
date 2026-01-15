package com.edscorp.eds.speaker.typeb.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;
import com.edscorp.eds.speaker.typeb.dto.SpkDisasterUpsertReq;
import com.edscorp.eds.speaker.typeb.repository.SpkDisasterRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpkDisasterService {
    private final SpkDisasterRepository disasterRepository;

    @Transactional
    public SpkDisaster create(SpkDisasterUpsertReq req) {

        String code = req.getDstCode();

        if (code == null || !code.matches("\\d{3}")) {
            throw new IllegalArgumentException("dstCode는 3자리 숫자여야 합니다. 예: 001");
        }

        if (disasterRepository.existsById(code)) {
            throw new IllegalArgumentException("이미 존재하는 dstCode 입니다: " + code);
        }

        SpkDisaster entity = new SpkDisaster();
        entity.setDstCode(code);
        entity.setDstName(req.getDstName());
        entity.setDstStoreMsg(req.getDstStoreMsg());
        entity.setDstUseFlag(req.getDstUseFlag());

        return disasterRepository.save(entity);
    }

    @Transactional
    public SpkDisaster update(String dstCode, SpkDisasterUpsertReq req) {
        SpkDisaster entity = disasterRepository.findById(dstCode)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 dstCode: " + dstCode));

        entity.setDstName(req.getDstName());
        entity.setDstStoreMsg(req.getDstStoreMsg());
        entity.setDstUseFlag(req.getDstUseFlag());

        return entity;
    }

    @Transactional
    public void deprecated(List<String> ids) {
        ids.forEach(id -> {
            SpkDisaster entity = disasterRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 dstCode: " + id));
            entity.setDstUseFlag("Unuse");
        });
    }

    @Transactional
    public void deleteHard(List<String> ids) {
        ids.forEach(disasterRepository::deleteById);
    }

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
