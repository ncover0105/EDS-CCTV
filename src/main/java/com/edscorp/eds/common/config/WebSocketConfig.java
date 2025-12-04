package com.edscorp.eds.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.edscorp.eds.cctv.handler.JanusWebSocketHandler;
import com.edscorp.eds.web.handler.WebSocketHandler;

import lombok.RequiredArgsConstructor;

// import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    // private final WebSocketHandler webSocketHandler;
    private final JanusWebSocketHandler janusWebSocketHandler;

    // public WebSocketConfig(WebSocketHandler webSocketHandler) {
    // this.webSocketHandler = webSocketHandler;
    // }
    // @Override
    // public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    // registry.addHandler(webSocketHandler, "/ws")
    // .setAllowedOrigins("*");
    // }

    // public WebSocketConfig(WebSocketHandler webSocketHandler) {
    // this.webSocketHandler = webSocketHandler;
    // }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new WebSocketHandler(), "/ws")
                .setAllowedOriginPatterns("*");
        // .withSockJS();

        registry.addHandler(janusWebSocketHandler, "/janus")
                .setAllowedOriginPatterns("*");
    }
}