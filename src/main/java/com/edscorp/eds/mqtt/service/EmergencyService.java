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
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
                resolveCctvName(e.getCctvCode()),
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
            Date dEnd = Date.from(LocalDateTime.now(ZONE).atZone(ZONE).toInstant());

            // 일자별·구역별·카메라별 데이터 범위
            Date dStart = toDate(today.minusDays(dailyDays - 1).atStartOfDay());
            List<EmergencyEntity> dailyEntities = fetchList(cctvCode, dStart, dEnd);

            // 추이 데이터 범위 (주간: 8주, 월간: 12개월)
            Date tStart;
            if (isMonthly) {
                tStart = toDate(today.minusMonths(11).withDayOfMonth(1).atStartOfDay());
            } else {
                tStart = toDate(today.minusWeeks(7).with(DayOfWeek.MONDAY).atStartOfDay());
            }
            List<EmergencyEntity> trendEntities = fetchList(cctvCode, tStart, dEnd);

            List<Map<String, Object>> trend = isMonthly
                    ? buildMonthlyTrend(trendEntities, today)
                    : buildWeeklyTrend(trendEntities, today);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("period", period);
            result.put("daily", buildDailyCounts(dailyEntities, today, dailyDays));
            result.put("trend", trend);
            result.put("byZone", buildByZone(dailyEntities));
            result.put("byCctv", buildByCctv(dailyEntities));
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

    private List<EmergencyEntity> fetchList(String cctvCode, Date start, Date end) {
        if (cctvCode != null && !cctvCode.isBlank()) {
            return repo.findByCctvCodeAndInpDttmBetweenOrderByInpDttmAsc(cctvCode, start, end);
        }
        return repo.findByInpDttmBetweenOrderByInpDttmAsc(start, end);
    }

    private Date toDate(LocalDateTime ldt) {
        return Date.from(ldt.atZone(ZONE).toInstant());
    }

    private List<Map<String, Object>> buildDailyCounts(List<EmergencyEntity> entities, LocalDate today, int days) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            countMap.put(today.minusDays(i).format(fmt), 0L);
        }
        for (EmergencyEntity e : entities) {
            if (e.getInpDttm() == null) continue;
            String key = e.getInpDttm().toInstant().atZone(ZONE).toLocalDate().format(fmt);
            countMap.computeIfPresent(key, (k, v) -> v + 1);
        }
        return countMap.entrySet().stream().map(entry -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", entry.getKey());
            m.put("count", entry.getValue());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildWeeklyTrend(List<EmergencyEntity> entities, LocalDate today) {
        WeekFields wf = WeekFields.ISO;
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate w = today.minusWeeks(i);
            countMap.put(w.getYear() + "-W" + String.format("%02d", w.get(wf.weekOfWeekBasedYear())), 0L);
        }
        for (EmergencyEntity e : entities) {
            if (e.getInpDttm() == null) continue;
            LocalDate d = e.getInpDttm().toInstant().atZone(ZONE).toLocalDate();
            String key = d.getYear() + "-W" + String.format("%02d", d.get(wf.weekOfWeekBasedYear()));
            countMap.computeIfPresent(key, (k, v) -> v + 1);
        }
        List<String> keys = new ArrayList<>(countMap.keySet());
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

    private List<Map<String, Object>> buildMonthlyTrend(List<EmergencyEntity> entities, LocalDate today) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yy.MM");
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            countMap.put(today.minusMonths(i).format(fmt), 0L);
        }
        for (EmergencyEntity e : entities) {
            if (e.getInpDttm() == null) continue;
            String key = e.getInpDttm().toInstant().atZone(ZONE).toLocalDate().format(fmt);
            countMap.computeIfPresent(key, (k, v) -> v + 1);
        }
        return countMap.entrySet().stream().map(entry -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", entry.getKey());
            m.put("count", entry.getValue());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildByZone(List<EmergencyEntity> entities) {
        Map<Integer, Long> zoneCount = new LinkedHashMap<>();
        for (EmergencyEntity e : entities) {
            Integer z = e.getBoundaryNum() != null ? e.getBoundaryNum() : 0;
            zoneCount.merge(z, 1L, Long::sum);
        }
        return zoneCount.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("label", entry.getKey() == 0 ? "미지정" : entry.getKey() + "번 구역");
                    m.put("count", entry.getValue());
                    return m;
                }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildByCctv(List<EmergencyEntity> entities) {
        Map<String, Long> cctvCount = new LinkedHashMap<>();
        Map<String, String> cctvNames = new LinkedHashMap<>();
        for (EmergencyEntity e : entities) {
            String code = e.getCctvCode();
            if (code == null || code.isBlank()) continue;
            cctvCount.merge(code, 1L, Long::sum);
            if (!cctvNames.containsKey(code)) {
                cctvNames.put(code, resolveCctvName(code));
            }
        }
        return cctvCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("cctvCode", entry.getKey());
                    m.put("cctvName", cctvNames.getOrDefault(entry.getKey(), entry.getKey()));
                    m.put("count", entry.getValue());
                    return m;
                }).collect(Collectors.toList());
    }

    private String resolveCctvName(String cctvCode) {
        if (cctvCode == null || cctvCode.isBlank()) {
            return "-";
        }
        try {
            return cctvRepository.findAllByCctvCode(cctvCode).stream()
                    .map(c -> c.getName())
                    .filter(name -> name != null && !name.isBlank())
                    .findFirst()
                    .orElse(cctvCode);
        } catch (Exception e) {
            log.warn("CCTV name resolve failed. cctvCode={}", cctvCode, e);
            return cctvCode;
        }
    }
}
