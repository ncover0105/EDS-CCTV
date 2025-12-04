package com.edscorp.eds.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponseDTO {
    private String temperature;
    private String weather;
    private String windspeed;
    private String winddirection;
    private String rainfall;
    private String humidity;
    private String icon;

    public static WeatherResponseDTO empty() {
        return new WeatherResponseDTO(
                "", "", "", "",
                "", "", "");
    }
}