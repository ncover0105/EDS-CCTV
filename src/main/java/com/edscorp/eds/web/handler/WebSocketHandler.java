package com.edscorp.eds.web.handler;

import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;

@Slf4j
public class WebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("🔗 클라이언트 연결됨: {}", session.getId());
        session.sendMessage(new TextMessage("{\"type\":\"system\",\"msg\":\"✅ 연결되었습니다.\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("📩 받은 메시지: {}", payload);

        try {
            JSONObject json = new JSONObject(payload);
            String type = json.optString("type");

            switch (type) {
                case "ping":
                    session.sendMessage(new TextMessage("{\"type\":\"pong\"}"));
                    break;

                case "command":
                    String cmd = json.optString("cmd");
                    log.info("➡️ 명령어 수신: {}", cmd);

                    // ACK 응답
                    session.sendMessage(new TextMessage(
                            new JSONObject().put("type", "ack").put("cmd", cmd).toString()
                    ));
                    break;

                default:
                    session.sendMessage(new TextMessage("{\"type\":\"error\",\"msg\":\"알 수 없는 타입\"}"));
            }
        } catch (Exception e) {
            log.error("❌ JSON 파싱 오류", e);
            session.sendMessage(new TextMessage("{\"type\":\"error\",\"msg\":\"잘못된 메시지\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("❌ 클라이언트 연결 종료: {}", session.getId());
    }
}