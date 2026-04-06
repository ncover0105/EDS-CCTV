package com.edscorp.eds.weather.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.edscorp.eds.common.util.Util;
import com.edscorp.eds.weather.domain.WeatherCondition;
import com.edscorp.eds.weather.dto.RAINAWSLISTVO;
import com.edscorp.eds.weather.dto.WeatherResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import jakarta.annotation.PostConstruct;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherDataService {

    private final WebClient webClient;

    private static final String VILLAGE_FCST_URL = "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst";
    private static final String CURRENT_WEATHER_URL = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min";

    @Value("${api.hub.key}")
    private String APIHUB_KEY;

    @Value("${api.hub.dg.stn}")
    private String APIHUB_STN;

    @Value("${api.hub.dg.nx}")
    private String nx;

    @Value("${api.hub.dg.ny}")
    private String ny;

    private volatile WeatherResponseDTO cachedAWSData;
    private volatile WeatherResponseDTO cachedForecastData;

    private static final String[] FORECAST_BASE_TIMES = {
            "0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"
    };

    @PostConstruct
    public void init() {
        refreshAWSData();
        refreshForecastData();
    }

    /**
     * 스케줄러 - 캐시 갱신
     * AWS 관측 데이터 (5분마다)
     */
    @Scheduled(fixedRate = 300_000)
    public void refreshAWSData() {
        String apiUrl = CURRENT_WEATHER_URL +
                "?authKey=" + APIHUB_KEY +
                "&stn=" + APIHUB_STN +
                "&disp=1&help=0";
        log.info("AWS 날씨 데이터 갱신 URL: {}", apiUrl);
        webClient.get()
                .uri(apiUrl)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseAWSData)
                .filter(this::isValidAws)
                .doOnNext(data -> {
                    cachedAWSData = data;
                    // log.info("AWS 날씨 데이터 캐시 갱신 완료");
                })
                .doOnError(e -> log.error("AWS 날씨 데이터 갱신 실패", e))
                .onErrorResume(e -> Mono.empty())
                .subscribe();
    }

    /** 예보 데이터 (30분마다) */
    @Scheduled(fixedRate = 1_800_000)
    public void refreshForecastData() {
        fetchForecastDataInternal()
                .doOnNext(data -> {
                    cachedForecastData = data;
                    // log.info("예보 날씨 데이터 캐시 갱신 완료: {}", data);
                })
                .doOnError(e -> log.error("예보 날씨 데이터 갱신 실패", e))
                .subscribe();
    }

    // 외부 호출용 (캐시 반환, null-safe)
    public WeatherResponseDTO getCachedAWSData() {
        return cachedAWSData != null ? cachedAWSData : WeatherResponseDTO.empty();
    }

    public WeatherResponseDTO getCachedForecastData() {
        return cachedForecastData != null ? cachedForecastData : WeatherResponseDTO.empty();
    }

    /**
     * AWS 관측 데이터 갱신
     * 
     * @param response
     * @return
     */
    private WeatherResponseDTO parseAWSData(String response) {
        WeatherResponseDTO dto = new WeatherResponseDTO();

        if (response == null || response.isBlank()) {
            dto.setWinddirection("N/A");
            return dto;
        }

        RAINAWSLISTVO data = new RAINAWSLISTVO();

        for (String line : response.split("\n")) {
            if (line == null)
                continue;
            line = line.trim();
            if (line.isBlank())
                continue;
            if (line.startsWith("#"))
                continue;

            String[] values = line.split(",");
            if (values.length > 14) {
                data.setWD1(values[2] != null ? values[2].trim() : null);
                data.setWS1(values[3] != null ? values[3].trim() : null);
                data.setWDS(values[4] != null ? values[4].trim() : null);
                data.setTA(values[8] != null ? values[8].trim() : null);
                data.setRN(values[10] != null ? values[10].trim() : null);
                data.setHM(values[14] != null ? values[14].trim() : null);
            }
        }

        dto.setTemperature(data.getTA());
        dto.setHumidity(data.getHM());
        dto.setWindspeed(data.getWS1());

        String wd1 = data.getWD1();
        if (wd1 == null || wd1.isBlank()) {
            dto.setWinddirection("N/A");
            return dto;
        }

        try {
            dto.setWinddirection(getSimpleDirection(Double.parseDouble(wd1)) + "풍");
        } catch (Exception e) {
            dto.setWinddirection("N/A");
        }

        return dto;
    }

    /** 예보 데이터 호출 */
    private Mono<WeatherResponseDTO> fetchForecastDataInternal() {

        LocalDateTime now = LocalDateTime.now();
        String[] forecastBase = resolveForecastBaseDateTime(now);
        String baseDate = forecastBase[0];
        String baseTime = forecastBase[1];

        String apiUrl = VILLAGE_FCST_URL + "?pageNo=1&numOfRows=1000&dataType=JSON" +
                "&base_date=" + baseDate + "&base_time=" + baseTime +
                "&nx=" + nx + "&ny=" + ny + "&authKey=" + APIHUB_KEY;

        log.info("예보 날씨 데이터 갱신 URL: {}", apiUrl);
        return webClient.get()
                .uri(apiUrl)
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> {

                    JSONObject jsonObj = new JSONObject(response);
                    JSONArray jsonArray = jsonObj
                            .getJSONObject("response")
                            .getJSONObject("body")
                            .getJSONObject("items")
                            .getJSONArray("item");

                    String targetDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                    String targetTime = Util.getRoundedHour();

                    Map<String, String> weatherDataMap = new HashMap<>();

                    for (int i = 0; i < jsonArray.length(); i++) {
                        JSONObject item = jsonArray.getJSONObject(i);
                        String fcstDate = item.getString("fcstDate");
                        String fcstTime = item.getString("fcstTime");

                        if (fcstDate.equals(targetDate) && fcstTime.equals(targetTime)) {
                            weatherDataMap.put(item.getString("category"), item.getString("fcstValue"));
                        }
                    }
                    // log.info("예보 날씨 데이터 갱신 완료: {}", weatherDataMap);

                    String sky = weatherDataMap.get("SKY");
                    String pty = weatherDataMap.get("PTY");
                    String pcp = weatherDataMap.get("PCP"); // "강수없음" 같은 문자열일 수 있음
                    String sno = weatherDataMap.get("SNO");
                    String tmp = weatherDataMap.get("TMP");

                    // log.info("[Forecast] targetTime={} SKY={}, PTY={}", targetTime, sky, pty);

                    if (sky == null || pty == null) {
                        // log.warn("[Forecast] SKY 또는 PTY 데이터 누락 - map={}", weatherDataMap);
                    }

                    WeatherCondition weatherCondition = WeatherCondition.fromForecast(sky, pty, pcp, sno, tmp);

                    // WeatherCondition weatherCondition = WeatherCondition.fromSkyAndPty(sky, pty);

                    WeatherResponseDTO dto = new WeatherResponseDTO();
                    dto.setRainfall(weatherDataMap.get("POP"));
                    dto.setWeather(weatherCondition.getCondition());
                    dto.setIcon(weatherCondition.getIcon());

                    return dto;
                })
                .doOnError(e -> log.error("[Forecast] 처리 실패", e));
    }

    private String[] resolveForecastBaseDateTime(LocalDateTime now) {
        LocalDateTime target = now.minusMinutes(10);
        String currentTime = target.format(DateTimeFormatter.ofPattern("HHmm"));
        String baseTime = FORECAST_BASE_TIMES[FORECAST_BASE_TIMES.length - 1];

        for (String candidate : FORECAST_BASE_TIMES) {
            if (candidate.compareTo(currentTime) <= 0) {
                baseTime = candidate;
            } else {
                break;
            }
        }

        if ("2300".equals(baseTime) && currentTime.compareTo("0200") < 0) {
            target = target.minusDays(1);
        }

        return new String[] {
                target.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                baseTime
        };
    }

    // 풍향 변환
    public static String getSimpleDirection(double degrees) {
        if (degrees == 360.0)
            return "무풍";
        degrees = (degrees % 360 + 360) % 360;
        String[] directions = { "북", "북동", "동", "남동", "남", "남서", "서", "북서" };
        int index = (int) Math.round(degrees / 45.0) % 8;
        return directions[index];
    }

    private boolean isValidAws(WeatherResponseDTO dto) {
        if (dto == null)
            return false;

        if (dto.getWinddirection() == null || dto.getWinddirection().isBlank() || "N/A".equals(dto.getWinddirection()))
            return false;

        return true;
    }
}
