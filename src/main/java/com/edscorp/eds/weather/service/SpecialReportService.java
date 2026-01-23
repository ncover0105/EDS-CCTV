package com.edscorp.eds.weather.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.edscorp.eds.rainfall.vo.global.RAINSPEACIALLISTVO;
import com.edscorp.eds.weather.client.KmaApiClient;
import com.edscorp.eds.weather.dto.TbWeatherWarningList;
import com.edscorp.eds.weather.dto.TbWeatherWarningListKey;
import com.edscorp.eds.weather.repository.TbWeatherWarningListRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpecialReportService {

    private final KmaApiClient kmaApiClient;
    private final TbWeatherWarningListRepository tbWeatherWarningListRepository;

    @Value("${api.hub.key}")
    private String APIHUB_KEY;

    // @Value("${api.hub.sido}")
    private String sido = "영덕군";

    private static final String SPECIAL_REPORT_URL = "https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php";

    private volatile Map<String, Object> cache = new HashMap<>();

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TM_IN_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmm"); // 12자리

    // 로그 샘플 출력 개수(너무 많으면 로그 폭발)
    private static final int SAMPLE_LOG_LIMIT = 5;
    // raw body 로그 길이 제한
    private static final int RAW_PREVIEW_LIMIT = 800;

    public Map<String, Object> getCachedSpecialReport() {
        return cache != null ? cache
                : Map.of(
                        "result", 0,
                        "data", List.of(),
                        "message", "특보 캐시 없음");
    }

    /** 5분마다 갱신 */
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void refresh() {
        log.info("[SPECIAL] refresh start: {}", LocalDateTime.now());
        log.info("[SPECIAL] filter sido raw = {}", sido);
        log.debug("[SPECIAL] filter sido bytes = {}", Arrays.toString(sido.getBytes(StandardCharsets.UTF_8)));

        fetch()
                .doOnNext(r -> {
                    @SuppressWarnings("unchecked")
                    List<RAINSPEACIALLISTVO> all = (List<RAINSPEACIALLISTVO>) r.getOrDefault("data", List.of());

                    // 파싱 결과 기본 로그
                    log.info("[SPECIAL] parsed list size = {}", all.size());

                    // 파싱 샘플 몇 건 확인(원인 추적용)
                    logSample("[SPECIAL][PARSED-SAMPLE]", all);

                    // 1) 전체 DB 저장 (필요시)
                    // saveAllToWarningList(all);

                    // 2) 화면(cache)용으로만 지역 필터
                    List<RAINSPEACIALLISTVO> filtered = all.stream()
                            .filter(v -> StringUtils.hasText(v.getREG_KO()) && v.getREG_KO().contains(sido))
                            .toList();

                    saveAllToWarningList(filtered);

                    // 필터링 결과 로그
                    log.info("[SPECIAL] filtered size = {} (sido contains: '{}')", filtered.size(), sido);
                    logSample("[SPECIAL][FILTERED-SAMPLE]", filtered);

                    // 누락(드랍) 사유 확인 로그 (DEBUG 권장)
                    // "왜 13 -> 12" 같은 케이스 추적할 때 가장 유용함
                    logDropReasons(all, sido);

                    Map<String, Object> cacheObj = new HashMap<>(r);
                    cacheObj.put("data", filtered);
                    cache = cacheObj;

                    log.info("[SPECIAL] refresh ok | all={} | filtered={}", all.size(), filtered.size());
                })
                .doOnError(e -> log.error("[SPECIAL] refresh fail (keep previous cache)", e))
                .onErrorResume(e -> Mono.just(getCachedSpecialReport()))
                .subscribe();
    }

    private Mono<Map<String, Object>> fetch() {
        String url = SPECIAL_REPORT_URL + "?fe=f&tm=&disp=0&help=0&authKey=" + APIHUB_KEY;

        // URL 확인(운영에서도 남겨도 부담 적음)
        log.info("[SPECIAL] request url={}", url);

        // raw body 확인 -> parse
        return kmaApiClient.getTextEuckr(url)
                .doOnNext(body -> {
                    int len = (body == null) ? 0 : body.length();
                    log.info("[SPECIAL] raw body length={}", len);

                    // 원문 전체는 너무 크면 위험하니 앞부분만 프리뷰
                    String preview = preview(body, RAW_PREVIEW_LIMIT);
                    log.info("[SPECIAL] raw body preview:\n{}", preview);
                })
                .map(this::parseSpecialReportText)
                .onErrorResume(e -> {
                    log.error("[SPECIAL] api error", e);
                    return Mono.just(getCachedSpecialReport());
                });
    }

    private Map<String, Object> parseSpecialReportText(String body) {
        Map<String, Object> result = new HashMap<>();
        List<RAINSPEACIALLISTVO> list = new ArrayList<>();

        if (!StringUtils.hasText(body)) {
            result.put("result", 1);
            result.put("data", list);
            result.put("message", "조회완료(데이터 없음)");
            return result;
        }

        int total = 0, parsed = 0;
        int skippedEmpty = 0, skippedShort = 0;

        for (String line : body.split("\n")) {
            total++;

            if (!StringUtils.hasText(line)) {
                skippedEmpty++;
                continue;
            }

            String[] v = line.split(",");
            if (v.length < 10) {
                skippedShort++;
                continue;
            }

            RAINSPEACIALLISTVO row = new RAINSPEACIALLISTVO();
            row.setREG_UP(safeTrim(v, 0));
            row.setREG_UP_KO(safeTrim(v, 1));
            row.setREG_ID(safeTrim(v, 2));
            row.setREG_KO(safeTrim(v, 3));
            row.setTM_FC(safeTrim(v, 4));
            row.setTM_EF(safeTrim(v, 5));
            row.setWRN(safeTrim(v, 6));

            String lvl = safeTrim(v, 7);
            if (StringUtils.hasText(lvl) && !lvl.contains("보"))
                lvl = lvl + "보";
            row.setLVL(lvl);

            row.setCMD(safeTrim(v, 8));
            row.setED_TM(safeTrim(v, 9));

            list.add(row);
            parsed++;
        }

        // 파싱 통계 로그(필수)
        log.info("[SPECIAL] parse stat | totalLine={} | parsed={} | skippedEmpty={} | skippedShort={}",
                total, parsed, skippedEmpty, skippedShort);

        result.put("result", 1);
        result.put("data", list); // 전체
        result.put("message", "조회완료");
        return result;
    }

    private void saveAllToWarningList(List<RAINSPEACIALLISTVO> all) {
        if (all == null || all.isEmpty())
            return;

        String tmIn = ZonedDateTime.now(KST).format(TM_IN_FMT); // 저장 시각(=입력시각)
        String stn = "143";

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        int saved = 0;
        int skippedSame = 0;

        for (RAINSPEACIALLISTVO v : all) {
            if (!StringUtils.hasText(v.getREG_ID()))
                continue;

            String regId = v.getREG_ID().trim();

            String wrnCode = mapWrnToCode(v.getWRN());
            if (!StringUtils.hasText(wrnCode))
                continue;

            // 이벤트 동일 판단용(= TM_IN 제외)
            String tmFc = to12Digits(v.getTM_FC());
            String tmEf = to12Digits(v.getTM_EF());
            String lvl = mapLvlToCode(v.getLVL());
            String cmd = mapCmdToCode(v.getCMD());

            // ✅ 동일 이벤트면 아무것도 하지 않고 스킵
            // boolean exists = tbWeatherWarningListRepository
            // .existsByIdStnAndIdRegIdAndIdWrnAndTmFcAndTmEfAndLvlAndCmd(
            // stn, regId, wrnCode, tmFc, tmEf, lvl, cmd);

            // if (exists) {
            // skippedSame++;
            // continue;
            // }

            boolean existsToday = tbWeatherWarningListRepository
                    .existsByIdStnAndIdRegIdAndIdWrnAndTmFcAndTmEfAndLvlAndCmdAndCreatedAtBetween(
                            stn,
                            regId,
                            wrnCode,
                            tmFc,
                            tmEf,
                            lvl,
                            cmd,
                            startOfDay,
                            endOfDay);

            if (existsToday) {
                skippedSame++;
                continue; // ✅ 이게 맞음
            }

            // ✅ 신규 이벤트면 저장 (TM_IN은 저장시각으로만 사용)
            TbWeatherWarningListKey key = new TbWeatherWarningListKey(
                    stn,
                    regId,
                    tmIn,
                    wrnCode);

            TbWeatherWarningList row = new TbWeatherWarningList();
            row.setId(key);
            row.setTmFc(tmFc);
            row.setTmEf(tmEf);
            row.setLvl(lvl);
            row.setCmd(cmd);
            row.setSend("0");

            tbWeatherWarningListRepository.save(row);
            saved++;
        }

        log.info("[SPECIAL] warning save done | saved={} | skippedSame={}", saved, skippedSame);
    }

    /*
     * =========================
     * Debug helpers
     * =========================
     */

    private void logSample(String prefix, List<RAINSPEACIALLISTVO> list) {
        if (list == null || list.isEmpty()) {
            log.info("{} empty", prefix);
            return;
        }

        int limit = Math.min(SAMPLE_LOG_LIMIT, list.size());
        for (int i = 0; i < limit; i++) {
            RAINSPEACIALLISTVO v = list.get(i);
            log.info("{} #{} regKo='{}' wrn='{}' lvl='{}' cmd='{}' tmFc='{}' tmEf='{}'",
                    prefix,
                    (i + 1),
                    safeStr(v.getREG_KO()),
                    safeStr(v.getWRN()),
                    safeStr(v.getLVL()),
                    safeStr(v.getCMD()),
                    safeStr(v.getTM_FC()),
                    safeStr(v.getTM_EF()));
        }
    }

    private void logDropReasons(List<RAINSPEACIALLISTVO> all, String sidoFilter) {
        if (!log.isDebugEnabled() || all == null || all.isEmpty())
            return;

        for (RAINSPEACIALLISTVO v : all) {
            String regKo = v.getREG_KO();
            if (!StringUtils.hasText(regKo)) {
                log.debug("[SPECIAL][DROP] regKo empty | wrn={} lvl={} cmd={}",
                        safeStr(v.getWRN()), safeStr(v.getLVL()), safeStr(v.getCMD()));
                continue;
            }
            if (!regKo.contains(sidoFilter)) {
                log.debug("[SPECIAL][DROP] region mismatch | regKo='{}' filter='{}'",
                        regKo, sidoFilter);
            }
        }
    }

    private String preview(String s, int limit) {
        if (!StringUtils.hasText(s))
            return "(empty)";
        if (s.length() <= limit)
            return s;
        return s.substring(0, limit) + "\n...(truncated, total=" + s.length() + ")";
    }

    private String safeStr(String s) {
        return (s == null) ? "-" : s;
    }

    private String to12Digits(String s) {
        if (!StringUtils.hasText(s))
            return null;
        String d = s.replaceAll("\\D", "");
        if (d.length() >= 12)
            return d.substring(0, 12);
        return d; // 원문이 12자리 미만이면 그대로(필요하면 null 처리해도 됨)
    }

    private String mapWrnToCode(String wrn) {
        if (!StringUtils.hasText(wrn))
            return null;
        String s = wrn.trim();

        // 이미 코드면 그대로 (W,R,S...)
        if (s.length() == 1)
            return s;

        return switch (s) {
            case "강풍" -> "W";
            case "호우" -> "R";
            case "한파" -> "C";
            case "건조" -> "D";
            case "해일" -> "O";
            case "지진해일" -> "N";
            case "풍랑" -> "V";
            case "태풍" -> "T";
            case "대설" -> "S";
            case "황사" -> "Y";
            case "폭염" -> "H";
            case "안개" -> "F";
            default -> null; // 모르는 값은 저장 스킵(원하면 s 저장도 가능)
        };
    }

    private String mapLvlToCode(String lvl) {
        if (!StringUtils.hasText(lvl))
            return null;
        String s = lvl.trim();

        // 이미 숫자면 그대로
        if (s.matches("\\d+"))
            return s;

        // "주의보", "경보", "예비" 등
        if (s.contains("예비"))
            return "1";
        if (s.contains("주의"))
            return "2";
        if (s.contains("경보"))
            return "3";
        return null;
    }

    private String mapCmdToCode(String cmd) {
        if (!StringUtils.hasText(cmd))
            return null;
        String s = cmd.trim();

        if (s.matches("\\d+"))
            return s;

        // wrn_now_data_new.php 기준 문자열이 "발효/해제/대치" 등으로 올 수 있음
        if (s.contains("발효") || s.contains("발표"))
            return "1";
        if (s.contains("대치해제"))
            return "4";
        if (s.contains("대치"))
            return "2";
        if (s.contains("해제"))
            return "3";
        if (s.contains("연장"))
            return "5";
        if (s.contains("변경해제"))
            return "7";
        if (s.contains("변경"))
            return "6";

        return null;
    }

    private String safeTrim(String[] arr, int idx) {
        if (arr == null || idx < 0 || idx >= arr.length || arr[idx] == null)
            return "";
        return arr[idx].trim();
    }
}
