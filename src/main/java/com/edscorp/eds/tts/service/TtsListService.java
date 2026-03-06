package com.edscorp.eds.tts.service;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.tts.domain.TtsList;
import com.edscorp.eds.tts.dto.TtsResponse;
import com.edscorp.eds.tts.dto.TtsUpsertRequest;
import com.edscorp.eds.tts.repository.TtsListRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TtsListService {

    private final TtsListRepository ttsListRepository;

    // @Transactional(readOnly = true)
    // public Page<TtsResponse> list(int page, int size, String useFlag, String q) {
    // Pageable pageable = PageRequest.of(page, size,
    // Sort.by("ttsId").descending());

    // String keyword = (q == null) ? "" : q.trim();
    // boolean hasQ = !keyword.isEmpty();
    // boolean hasUse = (useFlag != null && !useFlag.isBlank() &&
    // !"ALL".equalsIgnoreCase(useFlag));

    // Page<TtsList> result;

    // if (hasUse && hasQ) {
    // result = ttsListRepository.searchByUseFlagAndKeyword(useFlag, keyword,
    // pageable);
    // } else if (hasUse) {
    // result = ttsListRepository.findByTtsUseFlag(useFlag, pageable);
    // } else if (hasQ) {
    // result = ttsListRepository.searchByKeyword(keyword, pageable);
    // } else {
    // result = ttsListRepository.findAll(pageable);
    // }

    // return result.map(this::toResponse);
    // }

    @Transactional(readOnly = true)
    public Page<TtsResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ttsId"));
        return ttsListRepository.findAll(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TtsResponse get(Long id) {
        TtsList entity = ttsListRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TTS not found: " + id));
        return toResponse(entity);
    }

    @Transactional
    public TtsResponse create(TtsUpsertRequest req) {
        TtsList entity = TtsList.builder()
                .ttsName(req.getTtsName())
                .ttsMsg(req.getTtsMsg())
                .ttsUseFlag(normalizeUseFlag(req.getTtsUseFlag()))
                .build();

        return toResponse(ttsListRepository.save(entity));
    }

    @Transactional
    public TtsResponse update(Long id, TtsUpsertRequest req) {
        TtsList entity = ttsListRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TTS not found: " + id));

        entity.setTtsName(req.getTtsName());
        entity.setTtsMsg(req.getTtsMsg());
        entity.setTtsUseFlag(normalizeUseFlag(req.getTtsUseFlag()));

        // save() 호출 없이 Dirty Checking
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!ttsListRepository.existsById(id)) {
            throw new EntityNotFoundException("TTS not found: " + id);
        }
        ttsListRepository.deleteById(id);
    }

    private Boolean normalizeUseFlag(Boolean flag) {
        return flag == null ? true : flag;
    }

    private TtsResponse toResponse(TtsList e) {
        return TtsResponse.builder()
                .ttsId(e.getTtsId())
                .ttsName(e.getTtsName())
                .ttsMsg(e.getTtsMsg())
                .ttsUseFlag(e.getTtsUseFlag())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
