package com.edscorp.eds.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {
    // @Bean
    // public WebSocketHandler webSocketHandler() {
    // return new WebSocketHandler();
    // }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}
