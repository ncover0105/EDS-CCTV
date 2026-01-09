package com.edscorp.eds.speaker.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.speaker.domain.SpkWebAlertLogEntity;
import com.edscorp.eds.speaker.dto.SpkWebAlertLogResponseDTO;
import com.edscorp.eds.speaker.dto.SpkWebAlertLogSearchRequest;
import com.edscorp.eds.speaker.repository.SpkWebAlertLogRepository;
import com.edscorp.eds.speaker.repository.SpkWebAlertLogSpecs;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SpkWebAlertLogQueryService {

    private final SpkWebAlertLogRepository spkWebAlertLogRepository;

    private Specification<SpkWebAlertLogEntity> buildSpec(SpkWebAlertLogSearchRequest req) {
        // date가 있으면 date 우선(하루 조회)
        LocalDate fromDate = req.getDate() != null ? req.getDate() : req.getFrom();
        LocalDate toDate = req.getDate() != null ? req.getDate().plusDays(1)
                : (req.getTo() != null ? req.getTo().plusDays(1) : null);

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toExclusive = toDate != null ? toDate.atStartOfDay() : null;

        return Specification.where(SpkWebAlertLogSpecs.deviceIdEq(req.getDeviceId()))
                .and(SpkWebAlertLogSpecs.alertModeEq(req.getAlertMode()))
                .and(SpkWebAlertLogSpecs.alertPriorityEq(req.getAlertPriority()))
                .and(SpkWebAlertLogSpecs.createdAtGte(from))
                .and(SpkWebAlertLogSpecs.createdAtLt(toExclusive));
    }

    @Transactional(readOnly = true)
    public List<SpkWebAlertLogResponseDTO> latest3(SpkWebAlertLogSearchRequest req) {
        Specification<SpkWebAlertLogEntity> spec = buildSpec(req);

        // 최신 3건만
        Pageable pageable = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SpkWebAlertLogEntity> page = spkWebAlertLogRepository.findAll(spec, pageable);

        return page.getContent().stream().map(SpkWebAlertLogResponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<SpkWebAlertLogResponseDTO> page(SpkWebAlertLogSearchRequest req, int page, int size) {
        Specification<SpkWebAlertLogEntity> spec = buildSpec(req);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return spkWebAlertLogRepository.findAll(spec, pageable).map(SpkWebAlertLogResponseDTO::from);
    }

    @Transactional
    public SpkWebAlertLogEntity save(SpkWebAlertLogEntity entity) {
        return spkWebAlertLogRepository.save(entity);
    }
}
