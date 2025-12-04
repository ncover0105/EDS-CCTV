package com.edscorp.eds.cctv.stream;

import jakarta.websocket.Session;
import java.util.concurrent.CompletableFuture;

public class JanusSession {

    private long sessionId;
    private String handleId;
    private Session wsSession; // Jakarta WebSocket Session
    private Integer mountpointId;
    private CompletableFuture<String> offerFuture;

    public JanusSession() {
    }

    public JanusSession(long sessionId, String handleId, CompletableFuture<String> offerFuture, Session wsSession,
            Integer mountpointId) {
        this.sessionId = sessionId;
        this.handleId = handleId;
        this.offerFuture = offerFuture;
        this.wsSession = wsSession;
        this.mountpointId = mountpointId;
    }

    // Getter / Setter
    public long getSessionId() {
        return sessionId;
    }

    public void setSessionId(long sessionId) {
        this.sessionId = sessionId;
    }

    public String getHandleId() {
        return handleId;
    }

    public void setHandleId(String handleId) {
        this.handleId = handleId;
    }

    public Session getWsSession() {
        return wsSession;
    }

    public void setWsSession(Session wsSession) {
        this.wsSession = wsSession;
    }

    public Integer getMountpointId() {
        return mountpointId;
    }

    public void setMountpointId(Integer mountpointId) {
        this.mountpointId = mountpointId;
    }

    public CompletableFuture<String> getOfferFuture() {
        return offerFuture;
    }

    public void setOfferFuture(CompletableFuture<String> offerFuture) {
        this.offerFuture = offerFuture;
    }
}
