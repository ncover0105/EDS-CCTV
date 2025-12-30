package com.edscorp.eds.weather.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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

    @Value("${api.hub.sido}")
    private String sido;

    private static final String SPECIAL_REPORT_URL = "https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php";

    private volatile Map<String, Object> cache = new HashMap<>();

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TM_IN_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmm"); // 12자리

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
        log.info("[SPECIAL-TEST] regionName raw = {}", sido);
        log.info("[SPECIAL-TEST] regionName bytes = {}", Arrays.toString(sido.getBytes(StandardCharsets.UTF_8)));

        fetch()
                .doOnNext(r -> {
                    @SuppressWarnings("unchecked")
                    List<RAINSPEACIALLISTVO> all = (List<RAINSPEACIALLISTVO>) r.getOrDefault("data", List.of());

                    // 1) 전체 DB 저장
                    // saveAllToWarningList(all);

                    // 2) 화면(cache)용으로만 지역 필터
                    List<RAINSPEACIALLISTVO> filtered = all.stream()
                            .filter(v -> StringUtils.hasText(v.getREG_KO()) && v.getREG_KO().contains(sido))
                            .toList();

                    Map<String, Object> cacheObj = new HashMap<>(r);
                    cacheObj.put("data", filtered);
                    cache = cacheObj;

                    log.info("[SPECIAL] refresh ok | all={} | region={} | filtered={}", all.size(), sido,
                            filtered.size());
                })
                .doOnError(e -> log.error("[SPECIAL] refresh fail (keep previous cache)", e))
                .onErrorResume(e -> Mono.just(getCachedSpecialReport()))
                .subscribe();
    }

    private Mono<Map<String, Object>> fetch() {
        String url = SPECIAL_REPORT_URL + "?fe=f&tm=&disp=0&help=0&authKey=" + APIHUB_KEY;
        log.debug("[SPECIAL] request url={}", url);

        return kmaApiClient.getTextEuckr(url)
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

        for (String line : body.split("\n")) {
            total++;
            if (!StringUtils.hasText(line))
                continue;

            String[] v = line.split(",");
            if (v.length < 10)
                continue;

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

        log.info("[SPECIAL] parsed | totalLine={} | parsed={}", total, parsed);

        result.put("result", 1);
        result.put("data", list); // 전체
        result.put("message", "조회완료");
        return result;
    }

    private void saveAllToWarningList(List<RAINSPEACIALLISTVO> all) {
        if (all == null || all.isEmpty())
            return;

        String tmIn = ZonedDateTime.now(KST).format(TM_IN_FMT);
        String stn = "143"; // STN이 원문에 없으니 고정(3자리 맞춰야 함)

        for (RAINSPEACIALLISTVO v : all) {
            if (!StringUtils.hasText(v.getREG_ID()))
                continue;

            String wrnCode = mapWrnToCode(v.getWRN()); // 한글 → 코드(W/R/S…)
            if (!StringUtils.hasText(wrnCode))
                continue;

            TbWeatherWarningListKey key = new TbWeatherWarningListKey(
                    stn,
                    v.getREG_ID(),
                    tmIn,
                    wrnCode);

            TbWeatherWarningList row = new TbWeatherWarningList();
            row.setId(key);

            row.setTmFc(to12Digits(v.getTM_FC()));
            row.setTmEf(to12Digits(v.getTM_EF()));
            row.setLvl(mapLvlToCode(v.getLVL())); // 예: "주의보" → "2"
            row.setCmd(mapCmdToCode(v.getCMD())); // 예: "발효/해제" → "1/3"
            row.setSend("0"); // 기본: 미통보

            try {
                tbWeatherWarningListRepository.save(row);
            } catch (Exception dupOrOther) {
                // 같은 STN+REG_ID+TM_IN+WRN 이면 PK 중복 → 그냥 무시
            }
        }
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
