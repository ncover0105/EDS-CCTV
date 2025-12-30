package com.edscorp.eds.weather.client;

import java.nio.charset.Charset;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class KmaApiClient {

    private final WebClient webClient;

    public Mono<String> getText(String url) {
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> getTextEuckr(String url) {
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(byte[].class)
                .map(bytes -> new String(bytes, Charset.forName("EUC-KR")));
    }
}
