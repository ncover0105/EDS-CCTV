package com.edscorp.eds.weather.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AirQualityDTO {
    private String stationName;
    private Integer pm10;
    private Integer pm25;
    private String pm10Grade;
    private String pm25Grade;
    private String dataTime;
}