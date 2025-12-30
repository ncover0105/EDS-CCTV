// package com.edscorp.eds.weather.service;

// import java.io.File;
// import java.io.FileOutputStream;
// import java.io.InputStream;
// import java.net.URL;
// import java.nio.charset.Charset;
// import java.time.LocalDateTime;
// import java.time.format.DateTimeFormatter;
// import java.util.*;
// import java.util.concurrent.ConcurrentHashMap;

// import org.json.JSONArray;
// import org.json.JSONObject;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.scheduling.annotation.EnableScheduling;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Service;
// import org.springframework.util.StringUtils;
// import org.springframework.web.reactive.function.client.WebClient;

// import com.edscorp.eds.common.util.Util;
// import com.edscorp.eds.rainfall.vo.global.RAINAWSLISTVO;
// import com.edscorp.eds.rainfall.vo.global.RAINSPEACIALLISTVO;
// import com.edscorp.eds.weather.domain.WeatherCondition;
// import com.edscorp.eds.weather.dto.WeatherResponseDTO;

// import jakarta.annotation.PostConstruct;
// import lombok.extern.slf4j.Slf4j;
// import reactor.core.publisher.Mono;
// import reactor.core.scheduler.Schedulers;

// @Service
// @Slf4j
// @EnableScheduling
// public class WeatherService {

// private static final String VILLAGE_FCST_URL =
// "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst";

// private static final String CURRENT_WEATHER_URL =
// "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min";

// private static final String SPECIAL_REPORT_URL =
// "https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php";

// @Value("${api.hub.sido}")
// private String sido;

// @Value("${api.hub.key}")
// private String APIHUB_KEY;

// @Value("${eds.backs.file.path}")
// private String filePath;

// @Value("${api.hub.dg.stn}")
// private String APIHUB_STN;

// @Value("${api.hub.dg.nx}")
// private String nx;

// @Value("${api.hub.dg.ny}")
// private String ny;

// private final WebClient webClient;

// public WeatherService(WebClient.Builder builder) {
// this.webClient = builder.build();
// }

// // 캐시
// private volatile WeatherResponseDTO cachedAWSData;
// private volatile WeatherResponseDTO cachedForecastData;

// private Map<String, Object> cachedSatelliteImage = new HashMap<>();
// private Map<String, Object> cachedRadarImage = new HashMap<>();

// private volatile Map<String, Object> cachedSpecialReport = new HashMap<>();

// // 최근 저장된 파일 기록
// private final Map<String, String> lastSavedFile = new ConcurrentHashMap<>();

// @PostConstruct
// public void init() {
// try {
// log.info("🚀 서버 시작 시 위성/레이더 최초 이미지 다운로드 시작");
// cachedSatelliteImage = downloadSatelliteImageSafe().block();
// cachedRadarImage = downloadRadarImageSafe().block();
// log.info("🚀 서버 시작 시 최초 이미지 다운로드 완료");
// } catch (Exception e) {
// log.error("❌ 서버 시작 시 초기 다운로드 실패", e);
// }
// }

// /**
// * 스케줄러 - 캐시 갱신
// * AWS 관측 데이터 (2분마다)
// */
// @Scheduled(fixedRate = 60_000)
// public void refreshAWSData() {
// String apiUrl = CURRENT_WEATHER_URL +
// "?authKey=" + APIHUB_KEY +
// "&stn=" + APIHUB_STN +
// "&disp=1&help=0";

// webClient.get()
// .uri(apiUrl)
// .retrieve()
// .bodyToMono(String.class)
// .map(this::parseAWSData)
// .doOnNext(data -> {
// cachedAWSData = data;
// log.info("AWS 날씨 데이터 캐시 갱신 완료: {}", data);
// })
// .doOnError(e -> log.error("AWS 날씨 데이터 갱신 실패", e))
// .subscribe();
// }

// /** 예보 데이터 (1시간마다) */
// @Scheduled(fixedRate = 60_000)
// public void refreshForecastData() {
// fetchForecastDataInternal()
// .doOnNext(data -> {
// cachedForecastData = data;
// log.info("예보 날씨 데이터 캐시 갱신 완료: {}", data);
// })
// .doOnError(e -> log.error("예보 날씨 데이터 갱신 실패", e))
// .subscribe();
// }

// /** 위성 이미지 (15분마다) */
// // @Scheduled(fixedRate = 60_000)
// @Scheduled(fixedRate = 300_000)
// public void refreshSatelliteImageCache() {
// downloadSatelliteImageSafe()
// .subscribeOn(Schedulers.boundedElastic())
// .subscribe(
// result -> {
// cachedSatelliteImage = result;
// log.info("✅ 위성 이미지 캐시 갱신 완료");
// },
// error -> log.error("❌ 위성 이미지 다운로드 실패, 이전 캐시 유지", error));
// }

// /** 레이더 이미지 (15분마다) */
// @Scheduled(fixedRate = 300_000)
// public void refreshRadarImageCache() {
// downloadRadarImageSafe()
// .subscribeOn(Schedulers.boundedElastic())
// .subscribe(
// result -> {
// cachedRadarImage = result;
// log.info("✅ 레이더 이미지 캐시 갱신 완료");
// },
// error -> log.error("❌ 레이더 이미지 다운로드 실패, 이전 캐시 유지", error));
// }

// @Scheduled(fixedRate = 60_000)
// public void refreshSpecialReport() {
// fetchSpecialReportInternal()
// .doOnNext(result -> {
// cachedSpecialReport = result;
// log.info("특보 캐시 갱신 완료: {}", result.get("message"));
// })
// .doOnError(e -> log.error("특보 캐시 갱신 실패(이전 캐시 유지)", e))
// .onErrorResume(e -> Mono.just(getCachedSpecialReport()))
// .subscribe();
// }

// // 외부 호출용 (캐시 반환, null-safe)
// public WeatherResponseDTO getCachedAWSData() {
// return cachedAWSData != null ? cachedAWSData : WeatherResponseDTO.empty();
// }

// public WeatherResponseDTO getCachedForecastData() {
// return cachedForecastData != null ? cachedForecastData :
// WeatherResponseDTO.empty();
// }

// public Map<String, Object> getCachedSatelliteImage() {
// return cachedSatelliteImage;
// }

// public Map<String, Object> getCachedRadarImage() {
// return cachedRadarImage;
// }

// public Map<String, Object> getCachedSpecialReport() {
// return cachedSpecialReport != null ? cachedSpecialReport
// : Map.of(
// "result", 0,
// "data", List.of(),
// "message", "특보 캐시 없음");
// }

// /**
// * 내부 처리 메서드
// * AWS 관측 데이터 파싱
// */
// // private WeatherResponseDTO parseAWSData(String response) {
// // RAINAWSLISTVO data = new RAINAWSLISTVO();
// // for (String line : response.split("\n")) {
// // if (!line.contains("#")) {
// // String[] values = line.split(",");
// // if (values.length > 14) {
// // data.setWD1(values[2].trim());
// // data.setWS1(values[3].trim());
// // data.setWDS(values[4].trim());
// // data.setTA(values[8].trim());
// // data.setRN(values[10].trim());
// // data.setHM(values[14].trim());
// // }
// // }
// // }

// // WeatherResponseDTO dto = new WeatherResponseDTO();
// // dto.setTemperature(data.getTA());
// // dto.setHumidity(data.getHM());
// // dto.setWindspeed(data.getWS1());
// // try {
// // dto.setWinddirection(getSimpleDirection(Double.parseDouble(data.getWD1()))
// +
// // "풍");
// // } catch (NumberFormatException e) {
// // dto.setWinddirection("N/A");
// // }
// // return dto;
// // }

// private WeatherResponseDTO parseAWSData(String response) {
// WeatherResponseDTO dto = new WeatherResponseDTO();

// if (response == null || response.isBlank()) {
// dto.setWinddirection("N/A");
// return dto;
// }

// RAINAWSLISTVO data = new RAINAWSLISTVO();

// for (String line : response.split("\n")) {
// if (line == null)
// continue;
// line = line.trim();
// if (line.isBlank())
// continue;
// if (line.startsWith("#"))
// continue; // ✅ contains("#") 말고 startsWith("#")

// String[] values = line.split(",");
// if (values.length > 14) {
// data.setWD1(values[2] != null ? values[2].trim() : null);
// data.setWS1(values[3] != null ? values[3].trim() : null);
// data.setWDS(values[4] != null ? values[4].trim() : null);
// data.setTA(values[8] != null ? values[8].trim() : null);
// data.setRN(values[10] != null ? values[10].trim() : null);
// data.setHM(values[14] != null ? values[14].trim() : null);

// // ✅ “마지막 유효 라인” 기준으로 계속 갱신되게 하고 싶으면 break 하지 마세요.
// // ✅ “첫 유효 라인”만 쓰려면 여기서 break;
// }
// }

// dto.setTemperature(data.getTA());
// dto.setHumidity(data.getHM());
// dto.setWindspeed(data.getWS1());

// String wd1 = data.getWD1();
// if (wd1 == null || wd1.isBlank()) {
// dto.setWinddirection("N/A");
// return dto;
// }

// try {
// dto.setWinddirection(getSimpleDirection(Double.parseDouble(wd1)) + "풍");
// } catch (Exception e) { // ✅ NumberFormatException만 잡으면 NPE 못 막음
// dto.setWinddirection("N/A");
// }

// return dto;
// }

// /** 예보 데이터 호출 */
// private Mono<WeatherResponseDTO> fetchForecastDataInternal() {
// LocalDateTime now = LocalDateTime.now();
// String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
// String baseTime = now.getHour() >= 5 ? "0500" : "2350";

// String apiUrl = VILLAGE_FCST_URL + "?pageNo=1&numOfRows=1000&dataType=JSON" +
// "&base_date=" + baseDate + "&base_time=" + baseTime +
// "&nx=" + nx + "&ny=" + ny + "&authKey=" + APIHUB_KEY;

// return webClient.get()
// .uri(apiUrl)
// .retrieve()
// .bodyToMono(String.class)
// .map(response -> {
// JSONObject jsonObj = new JSONObject(response);
// JSONArray jsonArray = jsonObj
// .getJSONObject("response")
// .getJSONObject("body")
// .getJSONObject("items")
// .getJSONArray("item");

// Map<String, String> weatherDataMap = new HashMap<>();
// String targetTime = Util.getRoundedHour();

// for (int i = 0; i < jsonArray.length(); i++) {
// JSONObject item = jsonArray.getJSONObject(i);
// String fcstTime = item.getString("fcstTime");
// if (fcstTime.equals(targetTime)) {
// weatherDataMap.put(item.getString("category"), item.getString("fcstValue"));
// }
// }

// WeatherCondition weatherCondition = WeatherCondition.fromSkyAndPty(
// weatherDataMap.get("SKY"),
// weatherDataMap.get("PTY"));

// WeatherResponseDTO dto = new WeatherResponseDTO();
// dto.setRainfall(weatherDataMap.get("POP"));
// dto.setWeather(weatherCondition.getCondition());
// dto.setIcon(weatherCondition.getIcon());
// return dto;
// });
// }

// private Mono<Map<String, Object>> downloadSatelliteImageSafe() {
// String yesterday =
// LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
// String today =
// LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

// String listUrl = String.format(
// "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI005/FD/imageList?sDate=%s0000&eDate=%s2359&authKey=%s",
// yesterday, today, APIHUB_KEY);

// log.info("📡 [Satellite] 요청 URL → {}", listUrl);

// return webClient.get()
// .uri(listUrl)
// .retrieve()
// .bodyToMono(String.class)
// .flatMap(body -> Mono.fromCallable(() -> {
// JSONObject json = new JSONObject(body);
// JSONArray arr = json.optJSONArray("list");
// if (arr == null || arr.isEmpty())
// return cachedSatelliteImage;

// JSONObject latest = arr.getJSONObject(arr.length() - 1);
// String itemDate = latest.getString("item");
// String imageUrl = String.format(
// "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/image?date=%s&authKey=%s",
// itemDate, APIHUB_KEY);
// String savePath = filePath + "/static/imgFiles/sailimg/Satellite" + itemDate
// + ".png";

// log.info("[Satellite] 다운로드 URL → {}", imageUrl);
// log.info("[Satellite] 저장 경로 → {}", savePath);

// boolean success = downloadImageSafe(imageUrl, savePath);

// if (!success) {
// log.error("❌ [Satellite] 이미지 다운로드 실패. 기존 캐시 유지");
// return cachedSatelliteImage;
// }

// Map<String, Object> data = new HashMap<>();
// data.put("item", itemDate);
// data.put("sateName", "Satellite" + itemDate + ".png");

// Map<String, Object> result = new HashMap<>();
// result.put("result", 1);
// result.put("data", data);
// result.put("message", "조회완료");
// return result;
// }))
// .onErrorResume(e -> {
// log.error("❌ [Satellite] API 호출 중 오류", e);
// return Mono.just(cachedSatelliteImage);
// });
// }

// // 위성 이미지 다운로드
// // private Mono<Map<String, Object>> downloadSatelliteImageSafe() {
// // String yesterday =
// //
// LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
// // String today =
// // LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

// // log.info("downloadSatelliteImageSafe APIHUB_KEY = " + APIHUB_KEY);

// // String listUrl = String.format(
// //
// "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI005/FD/imageList?sDate=%s0000&eDate=%s2359&authKey=%s",
// // yesterday, today, APIHUB_KEY
// // );

// // log.info("📡 [Satellite] 요청 URL → {}", listUrl);

// // return webClient.get()
// // .uri(listUrl)
// // .exchangeToMono(response -> {
// // log.info("📡 [Satellite] 응답 상태 → {}", response.statusCode());

// // return response.bodyToMono(String.class)
// // .doOnNext(body -> log.debug("📡 [Satellite] 응답 Body (앞 500자): \n{}",
// // body.substring(0, Math.min(500, body.length()))));
// // })
// // .flatMap(body -> Mono.fromCallable(() -> {
// // if (body == null || !body.trim().startsWith("{")) {
// // log.error("❌ [Satellite] JSON 형식이 아님. body=\n{}", body);
// // return cachedSatelliteImage;
// // }

// // JSONObject json = new JSONObject(body);
// // JSONArray arr = json.optJSONArray("list");

// // if (arr == null || arr.isEmpty()) {
// // log.warn("⚠️ [Satellite] list 배열이 비어 있음");
// // return cachedSatelliteImage;
// // }

// // JSONObject latest = arr.getJSONObject(arr.length() - 1);
// // String itemDate = latest.optString("item", "");

// // if (itemDate.isEmpty()) {
// // log.error("❌ [Satellite] itemDate 없음");
// // return cachedSatelliteImage;
// // }

// // // ★ NOTE: 여기서 VI004/KO 이미지 사용 (현재 네 코드에 맞춤)
// // String imageUrl = String.format(
// //
// "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/image?date=%s&authKey=%s",
// // itemDate, APIHUB_KEY
// // );
// // String savePath = filePath + "/static/imgFiles/sailimg/Satellite" +
// itemDate
// // + ".png";

// // log.info("🖼️ [Satellite] 다운로드 URL → {}", imageUrl);
// // log.info("🖼️ [Satellite] 저장 경로 → {}", savePath);

// // boolean success = downloadImageSafe(imageUrl, savePath);

// // if (!success) {
// // log.error("❌ [Satellite] 이미지 다운로드 실패. 기존 캐시 유지");
// // return cachedSatelliteImage;
// // }

// // Map<String, Object> data = new HashMap<>();
// // data.put("item", itemDate);
// // data.put("sateName", "Satellite" + itemDate + ".png");

// // Map<String, Object> result = new HashMap<>();
// // result.put("result", 1);
// // result.put("data", data);
// // result.put("message", "조회완료");
// // return result;
// // }))
// // .onErrorResume(e -> {
// // log.error("❌ [Satellite] API 호출 중 오류", e);
// // return Mono.just(cachedSatelliteImage);
// // });
// // }

// // 레이더 이미지 다운로드
// // private Mono<Map<String, Object>> downloadRadarImageSafe() {
// // String today =
// // LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

// // log.info("downloadRadarImageSafe APIHUB_KEY = " + APIHUB_KEY);

// // // String listUrl = String.format(
// // //
// //
// "https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?cmp=HSR&tm=%s&authKey=%s",
// // // today, APIHUB_KEY
// // // );

// // String listUrl = String.format(
// //
// "https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?rdr=HSR&cmp=HSR&tm=%s&authKey=%s",
// // today, APIHUB_KEY
// // );

// // log.info("📡 [Radar] 요청 URL → {}", listUrl);

// // return webClient.get()
// // .uri(listUrl)
// // .retrieve()
// // .bodyToMono(String.class)
// // .flatMap(body -> Mono.fromCallable(() -> {
// // if (body == null || body.isBlank()) {
// // log.error("❌ [Radar] 응답 body 비어 있음");
// // return cachedRadarImage;
// // }

// // List<String> lines = Arrays.stream(body.split("\n"))
// // .filter(line -> !line.startsWith("#") && !line.isBlank())
// // .toList();

// // if (lines.isEmpty()) {
// // log.warn("⚠️ [Radar] 유효한 라인 없음");
// // return cachedRadarImage;
// // }

// // String lastLine = lines.get(lines.size() - 1);

// // if (lastLine.length() < 28) {
// // log.error("❌ [Radar] lastLine 길이 이상함 → {}", lastLine);
// // return cachedRadarImage;
// // }

// // String itemDate = lastLine.substring(16, 28);

// // String imageUrl = String.format(
// //
// "https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=%s&data=img&cmp=cmc&authKey=%s",
// // itemDate, APIHUB_KEY
// // );
// // String savePath = filePath + "/static/imgFiles/radar/radar" + itemDate +
// // ".png";

// // log.info("🖼️ [Radar] 다운로드 URL → {}", imageUrl);
// // log.info("🖼️ [Radar] 저장 경로 → {}", savePath);

// // boolean success = downloadImageSafe(imageUrl, savePath);

// // if (!success) {
// // log.error("❌ [Radar] 이미지 다운로드 실패. 기존 캐시 유지");
// // return cachedRadarImage;
// // }

// // // 필요하다면 여기서 폴더 정리도 가능 (위성처럼)
// // File folder = new File(filePath + "/static/imgFiles/radar");
// // File[] files = folder.listFiles();
// // if (files != null) {
// // for (File f : files) {
// // if (!f.getName().equals("radar" + itemDate + ".png")) {
// // f.delete();
// // }
// // }
// // }

// // Map<String, Object> data = new HashMap<>();
// // data.put("item", itemDate);
// // data.put("radarName", "radar" + itemDate + ".png");

// // Map<String, Object> result = new HashMap<>();
// // result.put("result", 1);
// // result.put("data", data);
// // result.put("message", "조회완료");
// // return result;
// // }))
// // .onErrorResume(e -> {
// // log.error("❌ [Radar] API 호출 중 오류", e);
// // return Mono.just(cachedRadarImage);
// // });
// // }

// private Mono<Map<String, Object>> downloadRadarImageSafe() {
// String today =
// LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
// String listUrl = String.format(
// "https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?rdr=HSR&cmp=HSR&tm=%s&authKey=%s",
// today, APIHUB_KEY);

// log.info("📡 [Radar] 요청 URL → {}", listUrl);

// return webClient.get()
// .uri(listUrl)
// .retrieve()
// .bodyToMono(String.class)
// .flatMap(body -> Mono.fromCallable(() -> {
// List<String> lines = Arrays.stream(body.split("\n"))
// .filter(line -> !line.startsWith("#") && !line.isBlank())
// .toList();
// if (lines.isEmpty())
// return cachedRadarImage;

// String lastLine = lines.get(lines.size() - 1);
// String itemDate = lastLine.substring(16, 28);
// String imageUrl = String.format(
// "https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=%s&data=img&cmp=cmc&authKey=%s",
// itemDate, APIHUB_KEY);
// String savePath = filePath + "/static/imgFiles/radar/radar" + itemDate +
// ".png";

// log.info("[Radar] 다운로드 URL → {}", imageUrl);
// log.info("[Radar] 저장 경로 → {}", savePath);

// boolean success = downloadImageSafe(imageUrl, savePath);

// if (!success)
// return cachedRadarImage;

// Map<String, Object> data = new HashMap<>();
// data.put("item", itemDate);
// data.put("radarName", "radar" + itemDate + ".png");

// Map<String, Object> result = new HashMap<>();
// result.put("result", 1);
// result.put("data", data);
// result.put("message", "조회완료");
// return result;
// }))
// .onErrorResume(e -> {
// log.error("❌ [Radar] API 호출 중 오류", e);
// return Mono.just(cachedRadarImage);
// });
// }

// private Mono<Map<String, Object>> fetchSpecialReportInternal() {
// // GLOBALController와 동일 파라미터 느낌 유지 (fe=f, disp=0, help=0, tm=빈값)
// String apiUrl = SPECIAL_REPORT_URL +
// "?fe=f&tm=&disp=0&help=0&authKey=" + APIHUB_KEY;

// return webClient.get()
// .uri(apiUrl)
// .retrieve()
// // ✅ EUC-KR 대응: byte[]로 받고 디코딩
// .bodyToMono(byte[].class)
// .map(bytes -> new String(bytes, Charset.forName("EUC-KR")))
// .map(this::parseSpecialReportText)
// .onErrorResume(e -> {
// log.error("특보 API 호출 실패", e);
// return Mono.just(getCachedSpecialReport());
// });
// }

// // WeatherService.java (파싱 메서드 추가)
// private Map<String, Object> parseSpecialReportText(String body) {
// Map<String, Object> result = new HashMap<>();

// if (!StringUtils.hasText(body)) {
// result.put("result", 1);
// result.put("data", List.of());
// result.put("message", "조회완료(데이터 없음)");
// return result;
// }

// List<RAINSPEACIALLISTVO> list = new ArrayList<>();

// for (String line : body.split("\n")) {
// if (!StringUtils.hasText(line))
// continue;

// // GLOBALController처럼 “지역명 포함 라인만”
// if (!line.contains(sido))
// continue;

// String[] v = line.split(",");
// // 최소 길이 방어 (GLOBALController는 0~9까지 사용)
// :contentReference[oaicite:2]{index=2}
// if (v.length < 10)
// continue;

// RAINSPEACIALLISTVO row = new RAINSPEACIALLISTVO();
// row.setREG_UP(safeTrim(v, 0));
// row.setREG_UP_KO(safeTrim(v, 1));
// row.setREG_ID(safeTrim(v, 2));
// row.setREG_KO(safeTrim(v, 3));
// row.setTM_FC(safeTrim(v, 4));
// row.setTM_EF(safeTrim(v, 5));
// row.setWRN(safeTrim(v, 6));

// // LVL 처리(“보” 없으면 붙이기) - 기존 로직 유지 :contentReference[oaicite:3]{index=3}
// String lvl = safeTrim(v, 7);
// if (StringUtils.hasText(lvl) && !lvl.contains("보")) {
// lvl = lvl + "보";
// }
// row.setLVL(lvl);

// row.setCMD(safeTrim(v, 8));
// row.setED_TM(safeTrim(v, 9));

// list.add(row);
// }

// result.put("result", 1);
// result.put("data", list);
// result.put("message", "조회완료");
// return result;
// }

// private String safeTrim(String[] arr, int idx) {
// if (arr == null || idx < 0 || idx >= arr.length || arr[idx] == null)
// return "";
// return arr[idx].trim();
// }

// // 풍향 변환
// public static String getSimpleDirection(double degrees) {
// if (degrees == 360.0)
// return "무풍";
// degrees = (degrees % 360 + 360) % 360;
// String[] directions = { "북", "북동", "동", "남동", "남", "남서", "서", "북서" };
// int index = (int) Math.round(degrees / 45.0) % 8;
// return directions[index];
// }

// // 이미지 다운로드
// private boolean downloadImageSafe(String imageUrl, String destinationPath) {
// File destFile = new File(destinationPath);
// File folder = destFile.getParentFile();
// try {
// if (folder.exists()) {
// for (File file : folder.listFiles()) {
// if (!file.getName().equals(destFile.getName())) {
// file.delete();
// }
// }
// } else {
// folder.mkdirs();
// }

// try (InputStream in = new URL(imageUrl).openStream();
// FileOutputStream out = new FileOutputStream(destFile)) {
// byte[] buffer = new byte[1024];
// int bytesRead;
// while ((bytesRead = in.read(buffer)) != -1) {
// out.write(buffer, 0, bytesRead);
// }
// }

// log.info("이미지 다운로드 완료: {}", destinationPath);
// return true;
// } catch (Exception e) {
// log.error("이미지 다운로드 실패: {}, 기존 이미지 유지", destinationPath, e);
// return false;
// }
// }

// }
