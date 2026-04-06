package com.edscorp.eds.weather.service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    private volatile Map<String, Object> cachedSatelliteImage = Collections.emptyMap();
    private volatile Map<String, Object> cachedRadarImage = Collections.emptyMap();

    @PostConstruct
    public void init() {
        downloadSatelliteImageSafe()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> cachedSatelliteImage = result,
                        error -> log.error("서버 시작 시 위성 이미지 초기 다운로드 실패", error));

        downloadRadarImageSafe()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> cachedRadarImage = result,
                        error -> log.error("서버 시작 시 레이더 이미지 초기 다운로드 실패", error));
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
                            // log.info("위성 이미지 캐시 갱신 완료");
                        },
                        error -> log.error("위성 이미지 다운로드 실패, 이전 캐시 유지", error));
    }

    /** 레이더 이미지 (15분마다) */
    @Scheduled(fixedRate = 300_000)
    public void refreshRadarImageCache() {
        downloadRadarImageSafe()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> {
                            cachedRadarImage = result;
                            // log.info("레이더 이미지 캐시 갱신 완료");
                        },
                        error -> log.error("레이더 이미지 다운로드 실패, 이전 캐시 유지", error));
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

        // log.info("📡 [Satellite] 요청 URL → {}", listUrl);

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
                    // String savePath = filePath + "/static/imgFiles/sailimg/Satellite" + itemDate
                    // + ".png";
                    String savePath = Paths
                            .get(filePath, "static", "imgFiles", "sailimg", "Satellite" + itemDate + ".png")
                            .toString();

                    // log.info("[Satellite] 다운로드 URL → {}", imageUrl);
                    // log.info("[Satellite] 저장 경로 → {}", savePath);

                    boolean success = downloadImageSafe(imageUrl, savePath);

                    if (!success) {
                        // log.error("[Satellite] 이미지 다운로드 실패. 기존 캐시 유지");
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
                    // log.error("[Satellite] API 호출 중 오류", e);
                    return Mono.just(cachedSatelliteImage);
                });
    }

    private Mono<Map<String, Object>> downloadRadarImageSafe() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String listUrl = String.format(
                "https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?rdr=HSR&cmp=HSR&tm=%s&authKey=%s",
                today, APIHUB_KEY);

        // log.info("📡 [Radar] 요청 URL → {}", listUrl);

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
                    String itemDate = extractRadarTimestamp(lastLine);
                    if (itemDate == null) {
                        log.warn("레이더 응답에서 시각을 추출하지 못했습니다. line={}", lastLine);
                        return cachedRadarImage;
                    }
                    String imageUrl = String.format(
                            "https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=%s&data=img&cmp=cmc&authKey=%s",
                            itemDate, APIHUB_KEY);
                    // String savePath = filePath + "/static/imgFiles/radar/radar" + itemDate +
                    // ".png";
                    String savePath = Paths.get(filePath, "static", "imgFiles", "radar", "radar" + itemDate + ".png")
                            .toString();

                    // log.info("[Radar] 다운로드 URL → {}", imageUrl);
                    // log.info("[Radar] 저장 경로 → {}", savePath);

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
                    // log.error("[Radar] API 호출 중 오류", e);
                    return Mono.just(cachedRadarImage);
                });
    }

    private String extractRadarTimestamp(String line) {
        Matcher matcher = Pattern.compile("(\\d{12})").matcher(line);
        return matcher.find() ? matcher.group(1) : null;
    }

    // 이미지 다운로드
    private boolean downloadImageSafe(String imageUrl, String destinationPath) {
        File destFile = new File(destinationPath);
        File folder = destFile.getParentFile();
        Path tempPath = null;
        try {
            if (!folder.exists() && !folder.mkdirs()) {
                log.error("폴더 생성 실패: {}", folder.getAbsolutePath());
                return false;
            }

            tempPath = Files.createTempFile(folder.toPath(), "weather-", ".tmp");

            try (InputStream in = new URL(imageUrl).openStream();
                    FileOutputStream out = new FileOutputStream(tempPath.toFile())) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }

            Files.move(tempPath, destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            File[] files = folder.listFiles();
            if (files == null) {
                log.error("폴더 접근 불가 또는 디렉터리 아님: {}", folder.getAbsolutePath());
                return false;
            }
            for (File file : files) {
                if (!file.getName().equals(destFile.getName())) {
                    Files.deleteIfExists(file.toPath());
                }
            }

            return true;
        } catch (Exception e) {
            log.error("이미지 다운로드 실패: {}, 기존 이미지 유지", destinationPath, e);
            return false;
        } finally {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (Exception e) {
                    log.debug("임시 파일 삭제 실패: {}", tempPath, e);
                }
            }
        }
    }
}
