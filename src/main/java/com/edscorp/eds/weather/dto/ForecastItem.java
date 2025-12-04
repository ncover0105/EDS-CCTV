package com.edscorp.eds.weather.dto;

import lombok.Data;

@Data
public class ForecastItem {
    private String category; // 자료구분코드
    private String fcstDate; // 예측날짜
    private String fcstTime; // 예측시간
    private String fcstValue; // 예측값

    // 카테고리 코드에 대한 설명을 반환하는 메소드
    public String getCategoryName() {
        return switch (category) {
            case "POP" -> "강수확률";
            case "PTY" -> "강수형태";
            case "REH" -> "습도";
            case "SKY" -> "하늘상태";
            case "TMP" -> "기온";
            case "TMN" -> "최저기온";
            case "TMX" -> "최고기온";
            case "UUU" -> "동서바람성분";
            case "VVV" -> "남북바람성분";
            case "WAV" -> "파고";
            case "VEC" -> "풍향";
            case "WSD" -> "풍속";
            default -> category;
        };
    }

    // 값에 대한 의미 있는 설명을 반환하는 메소드
    public String getFormattedValue() {
        return switch (category) {
            case "POP" -> fcstValue + "%";
            case "PTY" -> getPrecipitationTypeName();
            case "REH" -> fcstValue + "%";
            case "SKY" -> getSkyStatusName();
            case "TMP", "TMN", "TMX" -> fcstValue + "°C";
            case "UUU", "VVV" -> fcstValue + "m/s";
            case "WAV" -> fcstValue + "m";
            case "VEC" -> fcstValue + "°";
            case "WSD" -> fcstValue + "m/s";
            default -> fcstValue;
        };
    }

    // 강수형태 코드에 대한 설명
    private String getPrecipitationTypeName() {
        return switch (fcstValue) {
            case "0" -> "없음";
            case "1" -> "비";
            case "2" -> "비/눈";
            case "3" -> "눈";
            case "4" -> "소나기";
            default -> fcstValue;
        };
    }

    // 하늘상태 코드에 대한 설명
    private String getSkyStatusName() {
        return switch (fcstValue) {
            case "1" -> "맑음";
            case "3" -> "구름많음";
            case "4" -> "흐림";
            default -> fcstValue;
        };
    }
}
