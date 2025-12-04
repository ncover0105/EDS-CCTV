package com.edscorp.eds.weather.dto;

import lombok.Data;

@Data
public class CurrentWeatherDTO {
    private String temperature; // 기온
    private String humidity; // 습도
    private String windSpeed; // 풍속
    private String rainfall; // 강수량
}
