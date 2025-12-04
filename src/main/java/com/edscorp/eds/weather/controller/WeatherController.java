package com.edscorp.eds.weather.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.weather.dto.AirQualityDTO;
import com.edscorp.eds.weather.dto.WeatherResponseDTO;
import com.edscorp.eds.weather.service.AirQualityService;
import com.edscorp.eds.weather.service.WeatherService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Slf4j
public class WeatherController {
    private final WeatherService weatherService;
    private final AirQualityService airQualityService;

    @GetMapping("/forecast")
    public ResponseEntity<WeatherResponseDTO> getWeatherForecast() {
        return ResponseEntity.ok(weatherService.getCachedForecastData());
    }

    @GetMapping("/awsdata")
    public ResponseEntity<WeatherResponseDTO> getWeatherAWSData() {
        return ResponseEntity.ok(weatherService.getCachedAWSData());
    }

    @GetMapping("/getSatelliteImg")
    public ResponseEntity<Map<String, Object>> getSatelliteImg() {
        Map<String, Object> result = weatherService.getCachedSatelliteImage();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/getRadarImg")
    public ResponseEntity<Map<String, Object>> getRadarImg() {
        Map<String, Object> result = weatherService.getCachedRadarImage();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/air")
    public AirQualityDTO getAirInfo() {
        return airQualityService.getCachedAir();
    }

}
