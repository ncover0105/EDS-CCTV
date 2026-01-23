package com.edscorp.eds.weather.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.weather.dto.AirQualityDTO;
import com.edscorp.eds.weather.dto.TbWeatherWarningList;
import com.edscorp.eds.weather.dto.WeatherResponseDTO;
import com.edscorp.eds.weather.repository.TbWeatherWarningListRepository;
import com.edscorp.eds.weather.service.AirQualityService;
import com.edscorp.eds.weather.service.SpecialReportService;
import com.edscorp.eds.weather.service.WeatherDataService;
import com.edscorp.eds.weather.service.WeatherImageService;
// import com.edscorp.eds.weather.service.WeatherService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Slf4j
public class WeatherController {
    // private final WeatherService weatherService;

    private final WeatherDataService weatherDataService;
    private final WeatherImageService weatherImageService;
    private final SpecialReportService specialReportService;
    private final AirQualityService airQualityService;
    private final TbWeatherWarningListRepository tbWeatherWarningListRepository;

    /*
     * =========================
     * AWS / Forecast
     * =========================
     */
    @GetMapping("/forecast")
    public ResponseEntity<WeatherResponseDTO> getWeatherForecast() {
        return ResponseEntity.ok(weatherDataService.getCachedForecastData());
    }

    @GetMapping("/aws")
    public ResponseEntity<WeatherResponseDTO> getWeatherAWSData() {
        return ResponseEntity.ok(weatherDataService.getCachedAWSData());
    }

    /*
     * =========================
     * Weather Images
     * =========================
     */
    @GetMapping("/getSatelliteImg")
    public ResponseEntity<Map<String, Object>> getSatelliteImg() {
        Map<String, Object> result = weatherImageService.getCachedSatelliteImage();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/getRadarImg")
    public ResponseEntity<Map<String, Object>> getRadarImg() {
        Map<String, Object> result = weatherImageService.getCachedRadarImage();
        return ResponseEntity.ok(result);
    }

    /*
     * =========================
     * Air Quality
     * =========================
     */
    @GetMapping("/air")
    public AirQualityDTO getAirInfo() {
        return airQualityService.getCachedAir();
    }

    /*
     * =========================
     * Special Report (기상특보)
     * =========================
     */
    @GetMapping("/warning")
    public ResponseEntity<Map<String, Object>> getSpecialReport() {
        Map<String, Object> result = specialReportService.getCachedSpecialReport();

        // 디버깅
        log.debug("[WEATHER-CTRL] 기상특보 request | size={}",
                ((List<?>) result.getOrDefault("data", List.of())).size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/warning/history")
    public List<TbWeatherWarningList> history(
            @RequestParam(name = "stn", required = false) String stn, // 예: "143"
            @RequestParam(name = "wrn", required = false) String wrn, // 예: "R"
            @RequestParam(name = "lvl", required = false) String lvl, // 예: "2"
            @RequestParam(name = "cmd", required = false) String cmd, // 예: "1"
            @RequestParam(name = "regId", required = false) String regId, // 예: "L1070100"

            // 프론트(special_view.js)가 쓰는 이름과 매핑
            @RequestParam(name = "startDateTime", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,

            @RequestParam(name = "endDateTime", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,

            @RequestParam(name = "limit", defaultValue = "300") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 1000);

        // 선택: 공백이면 null 처리 (native query의 :param IS NULL 조건을 살리기 위함)
        stn = emptyToNull(stn);
        wrn = emptyToNull(wrn);
        lvl = emptyToNull(lvl);
        cmd = emptyToNull(cmd);
        regId = emptyToNull(regId);

        return tbWeatherWarningListRepository.search(
                stn, wrn, lvl, cmd, regId,
                start, end,
                safeLimit);
    }

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @GetMapping("/special/latest")
    public Map<String, Object> latest() {

        LocalDate today = LocalDate.now(KST);
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);

        return tbWeatherWarningListRepository.findFirstByCreatedAtBetweenOrderByCreatedAtDesc(start, end)
                .<Map<String, Object>>map(row -> Map.of(
                        "exists", true,
                        "data", Map.of(
                                "regId", row.getId().getRegId(),
                                "wrn", row.getId().getWrn(),
                                "tmIn", row.getId().getTmIn(),
                                "tmFc", row.getTmFc(),
                                "tmEf", row.getTmEf(),
                                "lvl", row.getLvl(),
                                "cmd", row.getCmd(),
                                "createdAt", row.getCreatedAt())))
                .orElseGet(() -> Map.of(
                        "exists", false,
                        "message", "오늘 특보 없음"));
    }

    private String emptyToNull(String v) {
        if (v == null)
            return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

}