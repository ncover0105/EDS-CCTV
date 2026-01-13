package com.edscorp.eds.mqtt.service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.edscorp.eds.mqtt.domain.EmergencyEntity;
import com.edscorp.eds.mqtt.dto.EmergencyLogRowDTO;
import com.edscorp.eds.mqtt.repository.EmergencyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmergencyService {

    private final EmergencyRepository repo;
    private final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final SimpleDateFormat OUT_FMT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public Page<EmergencyLogRowDTO> search(Integer boundaryNum, LocalDateTime from, LocalDateTime to, int page,
            int size) {

        // from/to 둘 다 없으면 "오늘 00:00 ~ now" 기본값
        if (from == null && to == null) {
            LocalDate today = LocalDate.now(ZONE);
            from = today.atStartOfDay();
            to = LocalDateTime.now(ZONE);
        }

        // 하나만 있을 경우 보정(실무에서 자주 발생)
        if (from != null && to == null) {
            to = LocalDateTime.now(ZONE);
        }
        if (from == null && to != null) {
            // to 기준 당일 00:00
            from = to.toLocalDate().atStartOfDay();
        }

        Date start = Date.from(ZonedDateTime.of(from, ZONE).toInstant());
        Date end = Date.from(ZonedDateTime.of(to, ZONE).toInstant());

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "inpDttm").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<EmergencyEntity> entityPage;

        // boundaryNum 없으면 전체
        if (boundaryNum == null) {
            entityPage = repo.findByInpDttmBetween(start, end, pageable);
        } else {
            // 1~4만 허용(그 외 값은 전체 처리 또는 예외 처리 중 선택)
            if (boundaryNum < 1 || boundaryNum > 4) {
                entityPage = repo.findByInpDttmBetween(start, end, pageable);
            } else {
                entityPage = repo.findByBoundaryNumAndInpDttmBetween(boundaryNum, start, end, pageable);
            }
        }

        return entityPage.map(e -> new EmergencyLogRowDTO(
                e.getId(),
                e.getCctvCode(),
                e.getAlertCode(),
                e.getBoundaryNum(),
                e.getLog(),
                e.getInpDttm() == null ? "-" : OUT_FMT.format(e.getInpDttm())));
    }
}