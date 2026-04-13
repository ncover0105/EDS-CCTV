package com.edscorp.eds.speaker.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

        LocalDate date = req.getDate();
        LocalDate fromReq = req.getFrom();
        LocalDate toReq = req.getTo();

        // 날짜 해석 규칙
        // 1) date 있으면 date 하루
        // 2) from/to 둘 다 있으면 기간
        // 3) from만 있으면 from 하루
        // 4) to만 있으면 to 하루
        // 5) 모두 없으면 오늘 하루(기본)
        LocalDate fromDate;
        LocalDate toExclusiveDate;

        if (date != null) {
            fromDate = date;
            toExclusiveDate = date.plusDays(1);
        } else if (fromReq != null && toReq != null) {
            // 순서 보정
            if (fromReq.isAfter(toReq)) {
                LocalDate tmp = fromReq;
                fromReq = toReq;
                toReq = tmp;
            }
            fromDate = fromReq;
            toExclusiveDate = toReq.plusDays(1);
        } else if (fromReq != null) {
            fromDate = fromReq;
            toExclusiveDate = fromReq.plusDays(1);
        } else if (toReq != null) {
            fromDate = toReq;
            toExclusiveDate = toReq.plusDays(1);
        } else {
            // 기본: 오늘
            fromDate = LocalDate.now(ZoneId.of("Asia/Seoul"));
            toExclusiveDate = fromDate.plusDays(1);
        }

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime toExclusive = toExclusiveDate.atStartOfDay();

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