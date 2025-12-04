package com.edscorp.eds.weather.dto;

import java.util.List;

import lombok.Data;

@Data
public class ForecastDTO {
    private String baseDate;
    private String baseTime;
    private List<ForecastItem> items;

    // 특정 카테고리의 예보 항목을 가져오는 헬퍼 메소드
    public List<ForecastItem> getItemsByCategory(String category) {
        return items.stream()
                .filter(item -> item.getCategory().equals(category))
                .toList();
    }
}
