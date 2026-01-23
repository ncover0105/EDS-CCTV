package com.edscorp.eds.weather.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.edscorp.eds.weather.dto.AirQualityDTO;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class AirQualityService {

    @Value("${air.api.key}")
    private String serviceKey;

    private String sidoName;

    private final WebClient client;
    private volatile AirQualityDTO cachedAir;

    public AirQualityService(WebClient.Builder builder) {
        this.client = builder.build();
    }

    @PostConstruct
    public void initAirQualityOnStartup() {
        log.info("🚀 서버 시작 → 대기질 최초 1회 갱신 실행");
        refreshAirQuality();
    }

    @Scheduled(fixedRate = 900000)
    public void refreshAirQuality() {
        sidoName = "경북";

        log.info("🔧 Air API 호출 준비 - serviceKey={}, sidoName={}",
                serviceKey, sidoName);

        String url = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty"
                + "?serviceKey=" + serviceKey
                + "&returnType=json"
                + "&numOfRows=100"
                + "&pageNo=1"
                + "&sidoName=" + sidoName
                + "&ver=1.0";

        client.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseAir)
                .doOnNext(dto -> {
                    cachedAir = dto;
                    log.info("대기질 갱신 완료: {}", dto);
                })
                .onErrorResume(e -> {
                    log.error("대기질 갱신 실패", e);
                    return Mono.empty();
                })
                .subscribe();
    }

    // private AirQualityDTO parseAir(String json) {
    // JSONObject root = new JSONObject(json);
    // JSONArray items = root
    // .getJSONObject("response")
    // .getJSONObject("body")
    // .getJSONArray("items");

    // JSONObject item = items.getJSONObject(0); // 첫 측정소 사용

    // AirQualityDTO dto = new AirQualityDTO();
    // dto.setStationName(item.getString("stationName"));
    // dto.setPm10(item.getInt("pm10Value"));
    // dto.setPm25(item.getInt("pm25Value"));
    // dto.setDataTime(item.getString("dataTime"));

    // dto.setPm10Grade(convertGrade(item.getString("pm10Grade")));
    // dto.setPm25Grade(convertGrade(item.getString("pm25Grade")));

    // return dto;
    // }

    private AirQualityDTO parseAir(String json) {
        JSONObject root = new JSONObject(json);
        JSONArray items = root
                .getJSONObject("response")
                .getJSONObject("body")
                .getJSONArray("items");

        JSONObject item = items.getJSONObject(0); // 첫 측정소 사용

        AirQualityDTO dto = new AirQualityDTO();
        dto.setStationName(item.getString("stationName"));

        int pm10 = item.optInt("pm10Value", -1);
        int pm25 = item.optInt("pm25Value", -1);

        dto.setPm10(pm10);
        dto.setPm25(pm25);
        dto.setDataTime(item.getString("dataTime"));

        // ▣ 미측정 데이터 처리 (환경부 API에서 "-" → optInt = -1)
        if (pm10 < 0) {
            dto.setPm10Grade("미측정");
        } else {
            dto.setPm10Grade(convertPm10Grade(pm10));
        }

        if (pm25 < 0) {
            dto.setPm25Grade("미측정");
        } else {
            dto.setPm25Grade(convertPm25Grade(pm25));
        }

        return dto;
    }

    private String convertGrade(String g) {
        return switch (g) {
            case "1" -> "좋음";
            case "2" -> "보통";
            case "3" -> "나쁨";
            case "4" -> "매우 나쁨";
            default -> "미측정";
        };
    }

    private String convertPm10Grade(int value) {
        if (value <= 30)
            return "좋음";
        else if (value <= 80)
            return "보통";
        else if (value <= 150)
            return "나쁨";
        else
            return "매우 나쁨";
    }

    private String convertPm25Grade(int value) {
        if (value <= 15)
            return "좋음";
        else if (value <= 35)
            return "보통";
        else if (value <= 75)
            return "나쁨";
        else
            return "매우 나쁨";
    }

    public AirQualityDTO getCachedAir() {
        return cachedAir != null ? cachedAir : new AirQualityDTO();
    }
}