package com.edscorp.eds.cctv.stream;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.edscorp.eds.common.util.Jsons;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JanusApi {

    private static final String JANUS_URL = "http://localhost:8088/janus";
    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Janus 연결 상태 확인
     * 
     * @return true = 연결 가능, false = 연결 불가
     */
    public boolean checkJanusConnection() {
        String url = JANUS_URL + "/info";
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            log.info("checkJanusConnection() 응답: {}", response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                JSONObject json = new JSONObject(response.getBody());
                // "janus":"server_info" 가 있으면 정상
                return "server_info".equalsIgnoreCase(json.optString("janus"));
            }
            return false;
        } catch (ResourceAccessException e) {
            log.error("Janus 서버에 접근할 수 없음: {}", e.getMessage());
            return false;
        } catch (HttpClientErrorException e) {
            log.error("Janus 서버 응답 오류: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Janus 연결 확인 중 예외 발생", e);
            return false;
        }
    }

    public JsonNode createSession() {
        String url = JANUS_URL;
        String body = Jsons.toString(Map.of("janus", "create", "transaction", "txn-" + System.currentTimeMillis()));
        log.info("createSession() 요청 URL: {}, Body: {}", url, body);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, getEntity(body), String.class);
            log.info("createSession() 응답: {}", response.getBody());
            return Jsons.parse(response.getBody());
        } catch (Exception e) {
            log.error("createSession() 실패", e);
            throw e;
        }
    }

    public JsonNode attachPlugin(long sessionId) {
        String url = JANUS_URL + "/" + sessionId;
        String body = Jsons.toString(Map.of(
                "janus", "attach",
                "plugin", "janus.plugin.streaming",
                "transaction", "txn-" + System.currentTimeMillis()));
        log.info("attachPlugin() 요청 URL: {}, Body: {}", url, body);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, getEntity(body), String.class);
            log.info("attachPlugin() 응답: {}", response.getBody());
            return Jsons.parse(response.getBody());
        } catch (Exception e) {
            log.error("attachPlugin() 실패", e);
            throw e;
        }
    }

    public JsonNode createMountpoint(long sessionId, long handleId, String rtspUrl, int mountpointId, int videoPort,
            String rtspId, String rtspPw) {
        String url = JANUS_URL + "/" + sessionId + "/" + handleId;

        Map<String, Object> body = Map.of(
                "janus", "message",
                "transaction", UUID.randomUUID().toString(),
                "body", Map.of(
                        "request", "create",
                        "type", "rtp",
                        "id", mountpointId,
                        "description", "CCTV-" + mountpointId,
                        "audio", false,
                        "video", true,
                        "videoport", videoPort,
                        "videopt", 96,
                        "videortpmap", "H264/90000",
                        "videofmtp", "packetization-mode=1"));

        // 요청 바디 내용 로깅
        try {
            String bodyJson = objectMapper.writeValueAsString(body);
            log.info("createMountpoint() 요청 URL: {}, Body: {}", url, bodyJson);
        } catch (JsonProcessingException e) {
            log.error("요청 바디 JSON 변환 실패", e);
        }

        log.info("createRtpMountpoint() 요청: session={}, handle={}, mountpoint={}, port={}, url={}",
                sessionId, handleId, mountpointId, videoPort, rtspUrl);
        ResponseEntity<String> resp = restTemplate.postForEntity(
                url,
                new HttpEntity<>(body, jsonHeaders()),
                String.class);
        log.info("createRtpMountpoint() 응답: {}", resp.getBody());
        try {
            return objectMapper.readTree(resp.getBody());
        } catch (Exception e) {
            log.error("응답 파싱 실패", e);
            throw new RuntimeException(e);
        }
    }

    /**
     * 스트림 목록 조회
     */
    public JsonNode listMountpoints(long sessionId, long handleId) {
        String url = JANUS_URL + "/" + sessionId + "/" + handleId;
        Map<String, Object> bodyMap = Map.of(
                "janus", "message",
                "transaction", "txn-" + System.currentTimeMillis(),
                "body", Map.of("request", "list"));
        String body = Jsons.toString(bodyMap);
        log.info("listMountpoints() 요청 URL: {}, Body: {}", url, body);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, getEntity(body), String.class);
            log.info("listMountpoints() 응답: {}", response.getBody());
            return Jsons.parse(response.getBody());
        } catch (Exception e) {
            log.error("listMountpoints() 실패", e);
            throw e;
        }
    }

    private HttpEntity<String> getEntity(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("Connection", "keep-alive");
        return h;
    }

    public JsonNode keepAlive(long sessionId) {
        String url = JANUS_URL + "/" + sessionId;
        String body = Jsons.toString(Map.of(
                "janus", "keepalive",
                "transaction", "txn-" + System.currentTimeMillis()));
        try {
            ResponseEntity<String> resp = restTemplate.postForEntity(url, getEntity(body), String.class);
            log.debug("keepAlive sessionId={} 응답: {}", sessionId, resp.getBody());
            return Jsons.parse(resp.getBody());
        } catch (Exception e) {
            log.error("keepAlive 실패 sessionId={}", sessionId, e);
            throw e;
        }
    }

    public static class JanusSession {
        public long sessionId;
        public long handleId;
    }
}
