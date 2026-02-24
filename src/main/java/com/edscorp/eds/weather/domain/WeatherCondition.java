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
        String safePty = (pty == null || pty.isBlank()) ? "0" : pty.trim();
        String safeSky = (sky == null || sky.isBlank()) ? "1" : sky.trim();

        switch (safePty) {
            case "0":
                break; // 강수 없음 → SKY로 판단
            case "1":
                return RAIN; // 비
            case "2":
                return SLEET; // 비/눈
            case "3":
                return SNOW; // 눈
            case "4":
                return SHOWER; // 소나기 (예보 전용)
            case "5":
                return RAIN; // ✅ 빗방울 (실황 전용)
            case "6":
                return SLEET; // ✅ 빗방울눈날림 (실황 전용)
            case "7":
                return SNOW; // ✅ 눈날림 (실황 전용)
            default:
                break;
        }

        switch (safeSky) {
            case "1":
                return CLEAR; // 맑음
            case "3":
                return CLOUDY; // 구름많음
            case "4":
                return OVERCAST; // 흐림
            default:
                return UNKNOWN;
        }
    }

    public static WeatherCondition fromForecast(String sky, String pty, String pcp, String sno, String tmp) {

        int ptyCode = parseCodeOrDefault(pty, 0);
        int skyCode = parseCodeOrDefault(sky, 1);

        double pcpMm = parseAmountMm(pcp); // "강수없음" -> 0
        double snoCm = parseAmountCm(sno); // "적설없음" -> 0
        double tmpC = parseDoubleOrNaN(tmp);

        // 결측 방어(+900/-900)
        if (isMissing(ptyCode))
            ptyCode = 0;
        if (isMissing(skyCode))
            skyCode = 1;

        // ✅ 1) 적설이 관측되면 눈 우선
        if (snoCm > 0.0) {
            // 기온이 양수이고 강수도 있으면 진눈개비로 표시할지 선택 가능
            if (!Double.isNaN(tmpC) && tmpC >= 0.0 && tmpC <= 2.0 && pcpMm > 0.0)
                return SLEET;
            return SNOW;
        }

        // ✅ 2) 강수가 관측되면 비/진눈개비 판정
        if (pcpMm > 0.0) {
            if (!Double.isNaN(tmpC) && tmpC >= 0.0 && tmpC <= 2.0)
                return SLEET;
            return RAIN;
        }

        // ✅ 3) PTY 기반 fallback (단기예보)
        switch (ptyCode) {
            case 0:
                break;
            case 1:
                return RAIN;
            case 2:
                return SLEET;
            case 3:
                return SNOW;
            case 4:
                return SHOWER;
            default:
                if (ptyCode == 5)
                    return RAIN;
                if (ptyCode == 6)
                    return SLEET;
                if (ptyCode == 7)
                    return SNOW;
                break;
        }

        // ✅ 4) SKY 기반
        switch (skyCode) {
            case 1:
                return CLEAR;
            case 3:
                return CLOUDY;
            case 4:
                return OVERCAST;
            default:
                return UNKNOWN;
        }
    }

    private static double parseAmountMm(String v) {
        if (v == null)
            return 0.0;
        String t = v.trim();
        if (t.isEmpty() || "-".equals(t))
            return 0.0;
        // 기상청 데이터는 "강수없음", "1mm 미만", "30.0mm" 형태가 섞일 수 있음
        if (t.contains("없음"))
            return 0.0;
        if (t.contains("미만"))
            return 0.5; // 보수적으로 0.5mm로 처리(표시용)
        t = t.replace("mm", "").trim();
        try {
            return Double.parseDouble(t);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private static double parseAmountCm(String v) {
        if (v == null)
            return 0.0;
        String t = v.trim();
        if (t.isEmpty() || "-".equals(t))
            return 0.0;
        if (t.contains("없음"))
            return 0.0;
        if (t.contains("미만"))
            return 0.5; // 0.5cm로 처리(표시용)
        t = t.replace("cm", "").trim();
        try {
            return Double.parseDouble(t);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private static double parseDoubleOrNaN(String v) {
        if (v == null)
            return Double.NaN;
        String t = v.trim();
        if (t.isEmpty() || "-".equals(t))
            return Double.NaN;
        try {
            return Double.parseDouble(t);
        } catch (Exception e) {
            return Double.NaN;
        }
    }

    private static int parseCodeOrDefault(String v, int def) {
        if (v == null)
            return def;
        String t = v.trim();
        if (t.isEmpty() || "-".equals(t))
            return def;
        try {
            return Integer.parseInt(t);
        } catch (Exception e) {
            return def;
        }
    }

    private static boolean isMissing(int code) {
        return code >= 900 || code <= -900;
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
