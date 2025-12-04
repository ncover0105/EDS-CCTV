package com.edscorp.eds.cctv.stream;
// package com.edscorp.eds.service;

// import java.time.Duration;
// import java.util.List;
// import java.util.Map;
// import java.util.UUID;
// import java.util.stream.Collectors;
// import java.util.stream.StreamSupport;

// import org.springframework.http.*;
// import org.springframework.scheduling.TaskScheduler;
// import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;
// import org.springframework.web.client.RestClientException;
// import org.springframework.web.client.RestTemplate;

// import com.fasterxml.jackson.databind.JsonNode;
// import com.fasterxml.jackson.databind.ObjectMapper;

// import jakarta.annotation.PostConstruct;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;

// @Service
// @Slf4j
// @RequiredArgsConstructor
// public class JanusService {

// // private final RestTemplate restTemplate = new RestTemplate();
// private final RestTemplate restTemplate;
// private final ObjectMapper objectMapper;

// @Value("${janus.admin.url}")
// private String adminUrl;

// @Value("${janus.public.url}")
// private String publicUrl;

// // HTTP 타임아웃 설정 (5초)
// private static final int TIMEOUT_SECONDS = 5;

// private String sessionId;
// private String handleId;

// private final TaskScheduler scheduler = createScheduler();

// @PostConstruct
// public void init() {
// // 세션 유지용 keepalive를 25초마다 실행
// scheduler.scheduleAtFixedRate(this::keepAlive, Duration.ofSeconds(25));
// }

// private ThreadPoolTaskScheduler createScheduler() {
// ThreadPoolTaskScheduler ts = new ThreadPoolTaskScheduler();
// ts.setPoolSize(2);
// ts.setThreadNamePrefix("janus-scheduler-");
// ts.initialize();
// return ts;
// }

// /**
// * 1) Janus 세션 생성
// */
// public boolean createSession() {
// try {
// Map<String,Object> body = Map.of(
// "janus", "create",
// "transaction", UUID.randomUUID().toString()
// );
// ResponseEntity<String> resp = restTemplate.postForEntity(
// publicUrl,
// new HttpEntity<>(body, jsonHeaders()),
// String.class
// );
// JsonNode root = objectMapper.readTree(resp.getBody());
// sessionId = root.path("data").path("id").asText(null);
// log.info("Janus session created: {}", sessionId);
// return sessionId != null;
// } catch (Exception e) {
// log.error("Exception creating Janus session", e);
// return false;
// }
// }

// /**
// * 2) Streaming 플러그인 attach
// */
// public boolean attachPlugin() {
// if (sessionId == null && !createSession()) return false;
// try {
// Map<String,Object> body = Map.of(
// "janus", "attach",
// "plugin", "janus.plugin.streaming",
// "transaction", UUID.randomUUID().toString()
// );
// String url = publicUrl + "/" + sessionId;
// ResponseEntity<String> resp = restTemplate.postForEntity(
// url,
// new HttpEntity<>(body, jsonHeaders()),
// String.class
// );
// JsonNode root = objectMapper.readTree(resp.getBody());
// handleId = root.path("data").path("id").asText(null);
// log.info("Streaming plugin attached: handleId={}", handleId);
// return handleId != null;
// } catch (Exception e) {
// log.error("Exception attaching plugin", e);
// return false;
// }
// }

// /**
// * Janus에 RTP stream 등록
// * @param id 스트림 ID
// * @param description 스트림 설명
// * @param videoPort 비디오 포트
// * @param videopt 비디오 페이로드 타입
// * @param videortpmap 비디오 RTP 맵
// * @return 응답 결과
// */

// public String createRtpStream(int id, String description, int videoPort, int
// videopt, String videortpmap) {
// if ((sessionId == null && !createSession()) || (handleId == null &&
// !attachPlugin())) {
// log.error("Cannot create RTP stream: sessionId={}, handleId={}", sessionId,
// handleId);
// return null;
// }
// try {
// Map<String,Object> msg = Map.of(
// "request", "create",
// "type", "rtp",
// "id", id,
// "description", description,
// "audio", false,
// "video", true,
// "videoport", videoPort,
// "videopt", videopt,
// "videortpmap", videortpmap
// );
// Map<String,Object> body = Map.of(
// "janus", "message",
// "transaction", UUID.randomUUID().toString(),
// "body", msg
// );
// String url = publicUrl + "/" + sessionId + "/" + handleId;
// ResponseEntity<String> resp = restTemplate.postForEntity(
// url,
// new HttpEntity<>(body, jsonHeaders()),
// String.class
// );
// if (resp.getStatusCode().is2xxSuccessful()) {
// log.info("RTP stream created: id={}, port={}", id, videoPort);
// // 생성 직후 목록 로그
// logRtpStreamList();
// } else {
// log.warn("Unexpected status creating RTP stream: {}", resp.getStatusCode());
// }
// return resp.getBody();
// } catch (Exception e) {
// log.error("Error creating RTP stream", e);
// return null;
// }
// }

// /**
// * 목록 조회 요청 및 로그 출력
// */
// public void logRtpStreamList() {
// String listJson = listRtpStreams();
// if (listJson == null) return;
// try {
// JsonNode root = objectMapper.readTree(listJson);
// JsonNode list = root.path("plugindata").path("data").path("list");
// List<String> infos = StreamSupport.stream(list.spliterator(), false)
// .map(node -> {
// int sid = node.path("id").asInt();
// String desc = node.path("description").asText();
// int port = node.path("videoport").asInt();
// return String.format("[id=%d, desc=%s, port=%d]", sid, desc, port);
// })
// .collect(Collectors.toList());
// log.info("Current RTP streams: {}", infos);
// } catch (Exception e) {
// log.error("Error parsing RTP stream list", e);
// }
// }

// public String listRtpStreams() {
// if ((sessionId == null && !createSession()) || (handleId == null &&
// !attachPlugin())) {
// log.error("Cannot list RTP streams: sessionId={}, handleId={}", sessionId,
// handleId);
// return null;
// }
// try {
// Map<String,Object> body = Map.of(
// "janus", "message",
// "transaction", UUID.randomUUID().toString(),
// "body", Map.of("request", "list")
// );
// String url = publicUrl + "/" + sessionId + "/" + handleId;
// ResponseEntity<String> resp = restTemplate.postForEntity(
// url,
// new HttpEntity<>(body, jsonHeaders()),
// String.class
// );
// if (resp.getStatusCode().is2xxSuccessful()) {
// return resp.getBody();
// } else {
// log.warn("Unexpected status listing RTP streams: {}", resp.getStatusCode());
// return null;
// }
// } catch (Exception e) {
// log.error("Error listing RTP streams", e);
// return null;
// }
// }

// /**
// * Janus RTP stream 제거
// * @param id 스트림 ID
// * @return 응답 결과
// */
// public String destroyRtpStream(int id) {
// if (sessionId == null || handleId == null) {
// log.warn("Cannot destroy RTP stream without session/handle");
// return null;
// }
// try {
// log.debug("Janus RTP 스트림 제거 요청: ID={}", id);

// Map<String,Object> body = Map.of(
// "janus", "message",
// "transaction", UUID.randomUUID().toString(),
// "body", Map.of("request", "destroy", "id", id)
// );
// String url = publicUrl + "/" + sessionId + "/" + handleId;
// HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, jsonHeaders());
// ResponseEntity<String> resp = restTemplate.postForEntity(url, req,
// String.class);
// if (resp.getStatusCode().is2xxSuccessful()) {
// log.info("RTP stream destroyed: id={}", id);
// } else {
// log.warn("Unexpected status destroying RTP stream: {}",
// resp.getStatusCode());
// }
// return resp.getBody();

// // HttpHeaders headers = new HttpHeaders();
// // headers.setContentType(MediaType.APPLICATION_JSON);
// // headers.set("Connection", "close");

// // HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

// // ResponseEntity<String> response = restTemplate.postForEntity(publicUrl,
// request, String.class);

// // if (response.getStatusCode().is2xxSuccessful()) {
// // log.info("Janus RTP 스트림 제거 성공: ID={}", id);
// // return response.getBody();
// // } else {
// // log.warn("Janus RTP 스트림 제거 응답 이상: ID={}, Status={}", id,
// response.getStatusCode());
// // return response.getBody();
// // }

// } catch (RestClientException e) {
// log.error("Janus RTP 스트림 제거 실패: ID={} - {}", id, e.getMessage());
// return null;
// } catch (Exception e) {
// log.error("Janus RTP 스트림 제거 중 예외: ID={} - {}", id, e.getMessage());
// return null;
// }
// }

// /**
// * Janus 서버 상태 확인
// * @return 서버 응답 가능 여부
// */
// public boolean checkJanusHealth() {
// try {
// Map<String,Object> body = Map.of(
// "janus", "info",
// "transaction", UUID.randomUUID().toString()
// );
// HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, jsonHeaders());
// ResponseEntity<String> resp = restTemplate.postForEntity(publicUrl, req,
// String.class);
// boolean healthy = resp.getStatusCode().is2xxSuccessful();
// log.debug("Janus health: {}", healthy);
// return healthy;
// } catch (Exception e) {
// log.error("Error checking Janus health", e);
// return false;
// }
// }

// private HttpHeaders jsonHeaders() {
// HttpHeaders headers = new HttpHeaders();
// headers.setContentType(MediaType.APPLICATION_JSON);
// headers.set("Connection", "close");
// return headers;
// }

// public void keepAlive() {
// if (sessionId == null) return;
// try {
// Map<String,Object> body = Map.of(
// "janus", "keepalive",
// "transaction", UUID.randomUUID().toString()
// );
// String url = publicUrl + "/" + sessionId;
// restTemplate.postForEntity(url, new HttpEntity<>(body, jsonHeaders()),
// String.class);
// log.debug("Sent keepalive for session {}", sessionId);
// } catch (Exception e) {
// log.error("Error sending keepalive", e);
// }
// }

// // public String createRtpStream(int id, String description, int videoPort,
// int videopt, String videortpmap) {
// // Map<String, Object> body = Map.of(
// // "janus", "message",
// // "transaction", UUID.randomUUID().toString(),
// // "body", Map.of(
// // "request", "create",
// // "type", "rtp",
// // "id", id,
// // "description", description,
// // "audio", false,
// // "video", true,
// // "videoport", videoPort,
// // "videopt", videopt,
// // "videortpmap", videortpmap
// // )
// // );

// // HttpHeaders headers = new HttpHeaders();
// // headers.setContentType(MediaType.APPLICATION_JSON);
// // HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, headers);

// // ResponseEntity<String> resp = restTemplate.postForEntity(publicUrl, req,
// String.class);
// // return resp.getBody();
// // }

// // public String destroyRtpStream(int id) {
// // Map<String, Object> body = Map.of(
// // "janus", "message",
// // "transaction", UUID.randomUUID().toString(),
// // "body", Map.of("request", "destroy", "id", id)
// // );
// // HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, new
// HttpHeaders());
// // ResponseEntity<String> resp = restTemplate.postForEntity(adminUrl, req,
// String.class);
// // return resp.getBody();
// // }

// }
