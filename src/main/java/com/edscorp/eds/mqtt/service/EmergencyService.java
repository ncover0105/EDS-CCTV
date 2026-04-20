package com.edscorp.eds.mqtt.service;

import java.text.SimpleDateFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.repository.CctvRepository;
import com.edscorp.eds.mqtt.domain.EmergencyEntity;
import com.edscorp.eds.mqtt.dto.EmergencyLogRowDTO;
import com.edscorp.eds.mqtt.repository.EmergencyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyService {

    private final EmergencyRepository repo;
    private final CctvRepository cctvRepository;
    private final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final SimpleDateFormat OUT_FMT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public Page<EmergencyLogRowDTO> search(Integer boundaryNum, LocalDateTime from, LocalDateTime to, int page,
            int size) {

        if (from == null && to == null) {
            LocalDate today = LocalDate.now(ZONE);
            from = today.atStartOfDay();
            to = LocalDateTime.now(ZONE);
        }
        if (from != null && to == null) {
            to = LocalDateTime.now(ZONE);
        }
        if (from == null && to != null) {
            from = to.toLocalDate().atStartOfDay();
        }

        Date start = Date.from(ZonedDateTime.of(from, ZONE).toInstant());
        Date end = Date.from(ZonedDateTime.of(to, ZONE).toInstant());

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "inpDttm").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<EmergencyEntity> entityPage;
        if (boundaryNum == null) {
            entityPage = repo.findByInpDttmBetween(start, end, pageable);
        } else {
            if (boundaryNum < 1 || boundaryNum > 4) {
                entityPage = repo.findByInpDttmBetween(start, end, pageable);
            } else {
                entityPage = repo.findByBoundaryNumAndInpDttmBetween(boundaryNum, start, end, pageable);
            }
        }

        Set<String> codeSet = entityPage.getContent().stream()
                .map(EmergencyEntity::getCctvCode)
                .filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> nameMap = loadCctvNames(codeSet);

        return entityPage.map(e -> new EmergencyLogRowDTO(
                e.getId(),
                e.getCctvCode(),
                nameMap.getOrDefault(e.getCctvCode(), e.getCctvCode() != null ? e.getCctvCode() : "-"),
                e.getAlertCode(),
                e.getBoundaryNum(),
                e.getLog(),
                e.getInpDttm() == null ? "-" : OUT_FMT.format(e.getInpDttm())));
    }

    // ===================================================================
    // 통계 그래프용 데이터
    // ===================================================================
    public Map<String, Object> getStats(String period, String cctvCode) {
        try {
            boolean isMonthly = "monthly".equals(period);
            int dailyDays = isMonthly ? 30 : 7;
            LocalDate today = LocalDate.now(ZONE);
            Date dEnd = toDate(LocalDateTime.now(ZONE));
            Date dStart = toDate(today.minusDays(dailyDays - 1).atStartOfDay());

            Date tStart;
            if (isMonthly) {
                tStart = toDate(today.minusMonths(11).withDayOfMonth(1).atStartOfDay());
            } else {
                tStart = toDate(today.minusWeeks(7).with(DayOfWeek.MONDAY).atStartOfDay());
            }

            String code = (cctvCode != null && !cctvCode.isBlank()) ? cctvCode : null;

            List<Object[]> byCctvRows = repo.countByCctv(dStart, dEnd, code);
            Set<String> cctvCodes = byCctvRows.stream()
                    .map(r -> (String) r[0])
                    .collect(Collectors.toSet());
            Map<String, String> nameMap = loadCctvNames(cctvCodes);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("period", period);
            result.put("daily", buildDailyFromDb(repo.countByDay(dStart, dEnd, code), today, dailyDays));
            result.put("trend", isMonthly
                    ? buildMonthlyTrendFromDb(repo.countByMonth(tStart, dEnd, code), today)
                    : buildWeeklyTrendFromDb(repo.countByWeek(tStart, dEnd, code), today));
            result.put("byZone", buildByZoneFromDb(repo.countByZone(dStart, dEnd, code)));
            result.put("byCctv", buildByCctvFromDb(byCctvRows, nameMap));
            return result;
        } catch (Exception e) {
            log.error("Emergency stats build failed. period={}, cctvCode={}", period, cctvCode, e);
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("period", period);
            fallback.put("daily", List.of());
            fallback.put("trend", List.of());
            fallback.put("byZone", List.of());
            fallback.put("byCctv", List.of());
            return fallback;
        }
    }

    private Date toDate(LocalDateTime ldt) {
        return Date.from(ldt.atZone(ZONE).toInstant());
    }

    private Map<String, String> loadCctvNames(Collection<String> codes) {
        if (codes == null || codes.isEmpty()) return Map.of();
        try {
            return cctvRepository.findAllByCctvCodeIn(codes).stream()
                    .filter(c -> c.getName() != null && !c.getName().isBlank())
                    .collect(Collectors.toMap(
                            CctvEntity::getCctvCode,
                            CctvEntity::getName,
                            (a, b) -> a));
        } catch (Exception e) {
            log.warn("CCTV name batch load failed", e);
            return Map.of();
        }
    }

    private List<Map<String, Object>> buildDailyFromDb(List<Object[]> rows, LocalDate today, int days) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            countMap.put(today.minusDays(i).format(fmt), 0L);
        }
        for (Object[] row : rows) {
            // DATE(inp_dttm) → java.sql.Date → "yyyy-MM-dd"
            String dbDate = row[0].toString();           // e.g. "2026-04-20"
            String key = dbDate.substring(5).replace("-", "/");  // → "04/20"
            countMap.computeIfPresent(key, (k, v) -> v + ((Number) row[1]).longValue());
        }
        return countMap.entrySet().stream().map(entry -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", entry.getKey());
            m.put("count", entry.getValue());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildWeeklyTrendFromDb(List<Object[]> rows, LocalDate today) {
        WeekFields wf = WeekFields.ISO;
        Map<Integer, Long> countMap = new LinkedHashMap<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate w = today.minusWeeks(i);
            int yw = w.getYear() * 100 + w.get(wf.weekOfWeekBasedYear());
            countMap.put(yw, 0L);
        }
        for (Object[] row : rows) {
            int yw = ((Number) row[0]).intValue();
            countMap.computeIfPresent(yw, (k, v) -> v + ((Number) row[1]).longValue());
        }
        List<Integer> keys = new ArrayList<>(countMap.keySet());
        int size = keys.size();
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            int weeksAgo = size - 1 - i;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", weeksAgo == 0 ? "이번주" : weeksAgo + "주전");
            m.put("count", countMap.get(keys.get(i)));
            result.add(m);
        }
        return result;
    }

    private List<Map<String, Object>> buildMonthlyTrendFromDb(List<Object[]> rows, LocalDate today) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yy.MM");
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            countMap.put(today.minusMonths(i).format(fmt), 0L);
        }
        for (Object[] row : rows) {
            String key = (String) row[0];  // DATE_FORMAT('%y.%m') → String
            countMap.computeIfPresent(key, (k, v) -> v + ((Number) row[1]).longValue());
        }
        return countMap.entrySet().stream().map(entry -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", entry.getKey());
            m.put("count", entry.getValue());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildByZoneFromDb(List<Object[]> rows) {
        return rows.stream().map(row -> {
            int zone = ((Number) row[0]).intValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", zone == 0 ? "미지정" : zone + "번 구역");
            m.put("count", ((Number) row[1]).longValue());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildByCctvFromDb(List<Object[]> rows, Map<String, String> nameMap) {
        return rows.stream().map(row -> {
            String code = (String) row[0];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("cctvCode", code);
            m.put("cctvName", nameMap.getOrDefault(code, code));
            m.put("count", ((Number) row[1]).longValue());
            return m;
        }).collect(Collectors.toList());
    }
}
