package com.edscorp.eds.weather.domain;

public enum WeatherCondition {

    // /production/fill/all/mist.svg

    // CLEAR("맑음", "brightness-high-fill.svg"),
    // CLOUDY("구름많음", "cloud-sun-fill.svg"),
    // OVERCAST("흐림", "clouds-fill.svg"),
    // RAIN("비", "cloud-rain-fill.svg"),
    // SLEET("비/눈", "cloud-sleet-fill.svg"),
    // SNOW("눈", "cloud-snow-fill.svg"),
    // SHOWER("소나기", "cloud-rain-heavy-fill.svg"),
    // THUNDERSTORM("천둥번개", "cloud-lightning-rain-fill.svg"),

    CLEAR("맑음", "clear-day.svg"),
    CLOUDY("구름많음", "overcast-day.svg"),
    OVERCAST("흐림", "overcast.svg"),
    RAIN("비", "rain.svg"),
    SLEET("비/눈", "sleet.svg"),
    SNOW("눈", "snow.svg"),
    SHOWER("소나기", "partly-cloudy-day-rain.svg"),
    THUNDERSTORM("천둥번개", "thunderstorms-rain.svg"),

    UNKNOWN("맑음", "clear-day.svg");

    private final String condition;
    private final String icon;

    WeatherCondition(String condition, String icon) {
        this.condition = condition;
        this.icon = icon;
    }

    public String getCondition() {
        return condition;
    }

    public String getIcon() {
        return icon;
    }

    public static WeatherCondition fromSkyAndPty(String sky, String pty) {
        switch (pty) {
            case "1":
                return RAIN;
            case "2":
                return SLEET;
            case "3":
                return SNOW;
            case "4":
                return SHOWER;
        }

        switch (sky) {
            case "1":
                return CLEAR;
            case "3":
                return CLOUDY;
            case "4":
                return OVERCAST;
        }

        return UNKNOWN;
    }

    // 날씨 상태에 맞는 아이콘을 반환
    public static String getIconByCondition(String weatherCondition) {
        for (WeatherCondition condition : WeatherCondition.values()) {
            if (condition.getCondition().equals(weatherCondition)) {
                return condition.getIcon();
            }
        }
        return "bi-cloud"; // 기본 아이콘
    }
}
