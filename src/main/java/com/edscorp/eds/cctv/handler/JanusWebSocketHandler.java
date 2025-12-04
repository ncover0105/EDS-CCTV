package com.edscorp.eds.cctv.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Slf4j
@Component
@RequiredArgsConstructor
public class JanusWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode msg = objectMapper.readTree(message.getPayload());
        log.info("📩 Client message: {}", msg);

        // 브라우저에서 offer SDP 전달 → Janus에 전달 → answer 받아 다시 클라이언트로 전달
        // ICE candidate 교환도 동일
    }

}
