package com.edscorp.eds.weather.service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherImageService {

    private final WebClient webClient;

    @Value("${eds.backs.file.path}")
    private String filePath;

    @Value("${api.hub.key}")
    private String APIHUB_KEY;

    private Map<String, Object> cachedSatelliteImage = new HashMap<>();
    private Map<String, Object> cachedRadarImage = new HashMap<>();

    @PostConstruct
    public void init() {
        try {
            log.info("🚀 서버 시작 시 위성/레이더 최초 이미지 다운로드 시작");
            cachedSatelliteImage = downloadSatelliteImageSafe().block();
            cachedRadarImage = downloadRadarImageSafe().block();
            log.info("🚀 서버 시작 시 최초 이미지 다운로드 완료");
        } catch (Exception e) {
            log.error("❌ 서버 시작 시 초기 다운로드 실패", e);
        }
    }

    /** 위성 이미지 (15분마다) */
    // @Scheduled(fixedRate = 60_000)
    @Scheduled(fixedRate = 300_000)
    public void refreshSatelliteImageCache() {
        downloadSatelliteImageSafe()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> {
                            cachedSatelliteImage = result;
                            log.info("✅ 위성 이미지 캐시 갱신 완료");
                        },
                        error -> log.error("❌ 위성 이미지 다운로드 실패, 이전 캐시 유지", error));
    }

    /** 레이더 이미지 (15분마다) */
    @Scheduled(fixedRate = 300_000)
    public void refreshRadarImageCache() {
        downloadRadarImageSafe()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> {
                            cachedRadarImage = result;
                            log.info("✅ 레이더 이미지 캐시 갱신 완료");
                        },
                        error -> log.error("❌ 레이더 이미지 다운로드 실패, 이전 캐시 유지", error));
    }

    public Map<String, Object> getCachedSatelliteImage() {
        return cachedSatelliteImage;
    }

    public Map<String, Object> getCachedRadarImage() {
        return cachedRadarImage;
    }

    private Mono<Map<String, Object>> downloadSatelliteImageSafe() {
        String yesterday = LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        String listUrl = String.format(
                "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI005/FD/imageList?sDate=%s0000&eDate=%s2359&authKey=%s",
                yesterday, today, APIHUB_KEY);

        log.info("📡 [Satellite] 요청 URL → {}", listUrl);

        return webClient.get()
                .uri(listUrl)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(body -> Mono.fromCallable(() -> {
                    JSONObject json = new JSONObject(body);
                    JSONArray arr = json.optJSONArray("list");
                    if (arr == null || arr.isEmpty())
                        return cachedSatelliteImage;

                    JSONObject latest = arr.getJSONObject(arr.length() - 1);
                    String itemDate = latest.getString("item");
                    String imageUrl = String.format(
                            "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/image?date=%s&authKey=%s",
                            itemDate, APIHUB_KEY);
                    String savePath = filePath + "/static/imgFiles/sailimg/Satellite" + itemDate + ".png";

                    log.info("[Satellite] 다운로드 URL → {}", imageUrl);
                    log.info("[Satellite] 저장 경로 → {}", savePath);

                    boolean success = downloadImageSafe(imageUrl, savePath);

                    if (!success) {
                        log.error("❌ [Satellite] 이미지 다운로드 실패. 기존 캐시 유지");
                        return cachedSatelliteImage;
                    }

                    Map<String, Object> data = new HashMap<>();
                    data.put("item", itemDate);
                    data.put("sateName", "Satellite" + itemDate + ".png");

                    Map<String, Object> result = new HashMap<>();
                    result.put("result", 1);
                    result.put("data", data);
                    result.put("message", "조회완료");
                    return result;
                }))
                .onErrorResume(e -> {
                    log.error("❌ [Satellite] API 호출 중 오류", e);
                    return Mono.just(cachedSatelliteImage);
                });
    }

    private Mono<Map<String, Object>> downloadRadarImageSafe() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String listUrl = String.format(
                "https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?rdr=HSR&cmp=HSR&tm=%s&authKey=%s",
                today, APIHUB_KEY);

        log.info("📡 [Radar] 요청 URL → {}", listUrl);

        return webClient.get()
                .uri(listUrl)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(body -> Mono.fromCallable(() -> {
                    List<String> lines = Arrays.stream(body.split("\n"))
                            .filter(line -> !line.startsWith("#") && !line.isBlank())
                            .toList();
                    if (lines.isEmpty())
                        return cachedRadarImage;

                    String lastLine = lines.get(lines.size() - 1);
                    String itemDate = lastLine.substring(16, 28);
                    String imageUrl = String.format(
                            "https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=%s&data=img&cmp=cmc&authKey=%s",
                            itemDate, APIHUB_KEY);
                    String savePath = filePath + "/static/imgFiles/radar/radar" + itemDate + ".png";

                    log.info("[Radar] 다운로드 URL → {}", imageUrl);
                    log.info("[Radar] 저장 경로 → {}", savePath);

                    boolean success = downloadImageSafe(imageUrl, savePath);

                    if (!success)
                        return cachedRadarImage;

                    Map<String, Object> data = new HashMap<>();
                    data.put("item", itemDate);
                    data.put("radarName", "radar" + itemDate + ".png");

                    Map<String, Object> result = new HashMap<>();
                    result.put("result", 1);
                    result.put("data", data);
                    result.put("message", "조회완료");
                    return result;
                }))
                .onErrorResume(e -> {
                    log.error("❌ [Radar] API 호출 중 오류", e);
                    return Mono.just(cachedRadarImage);
                });
    }

    // 이미지 다운로드
    private boolean downloadImageSafe(String imageUrl, String destinationPath) {
        File destFile = new File(destinationPath);
        File folder = destFile.getParentFile();
        try {
            if (folder.exists()) {
                for (File file : folder.listFiles()) {
                    if (!file.getName().equals(destFile.getName())) {
                        file.delete();
                    }
                }
            } else {
                folder.mkdirs();
            }

            try (InputStream in = new URL(imageUrl).openStream();
                    FileOutputStream out = new FileOutputStream(destFile)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }

            log.info("이미지 다운로드 완료: {}", destinationPath);
            return true;
        } catch (Exception e) {
            log.error("이미지 다운로드 실패: {}, 기존 이미지 유지", destinationPath, e);
            return false;
        }
    }
}
