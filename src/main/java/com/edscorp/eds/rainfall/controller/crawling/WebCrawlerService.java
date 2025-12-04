package com.edscorp.eds.rainfall.controller.crawling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.edscorp.eds.weather.domain.WeatherCondition;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebCrawlerService {

    // private static final String WEATHER_URL =
    // "https://www.weather.go.kr/weather/observation/currentweather.jsp"; // 기상청
    // 날씨누리 URL
    // private Map<String, Map<String, String>> weatherCache = new
    // ConcurrentHashMap<>();

    public List<Map<String, Object>> crawlUrl(String url) {
        List<Map<String, Object>> rainfallData = new ArrayList<>();
        try {
            // SSL 인증서 무시
            System.setProperty("jsse.enableSNIExtension", "false");
            TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return null;
                        }

                        public void checkClientTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }

                        public void checkServerTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                    }
            };
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            // URL을 로드하여 HTML 문서를 가져옴
            Document doc = Jsoup.connect(url).get();

            // .scroll1cont 클래스를 가진 div 요소를 선택
            Elements scrollDivs = doc.select(".scroll1cont");

            // 각 div 요소의 내용을 순회하며 테이블 데이터 추출
            for (Element scrollDiv : scrollDivs) {
                // div 요소 내의 table 요소 선택
                Element table = scrollDiv.selectFirst("table");

                // thead의 값 추출하여 키로 사용
                Elements theadColumns = table.select("thead tr th");
                List<String> keys = new ArrayList<>();
                for (Element th : theadColumns) {
                    keys.add(th.text());
                }

                // tbody의 값 추출하여 value로 사용
                Elements tbodyRows = table.select("tbody tr");
                for (Element row : tbodyRows) {
                    Elements columns = row.select("th, td");
                    if (columns.size() >= keys.size()) {
                        Map<String, Object> rowData = new HashMap<>();
                        for (int i = 0; i < keys.size(); i++) {
                            rowData.put(keys.get(i), columns.get(i).text());
                        }
                        rainfallData.add(rowData);
                    }
                }
            }
        } catch (IOException | NoSuchAlgorithmException | KeyManagementException e) {
            e.printStackTrace();
        }
        return rainfallData;
    }

    // Weather data crawling
    // @Scheduled(fixedRate = 600000) // 10m
    // // @Scheduled(cron = "0 0/10 * * * *")
    // public void updateWeatherData() {
    // System.out.println("최신 날씨 정보를 가져오는 중...");

    // try {
    // Document doc = Jsoup.connect(WEATHER_URL).get();
    // // System.out.println("updateWeatherData doc : " + doc.outerHtml());
    // Element overScrollDiv = doc.selectFirst(".over-scroll");

    // // over-scroll 내부의 테이블 찾기
    // if (overScrollDiv == null) {
    // System.out.println("updateWeatherData : 'over-scroll' 클래스를 가진 div를 찾을 수
    // 없습니다.");
    // return;
    // }

    // Element weatherTable = overScrollDiv.selectFirst("table#weather_table");
    // if (weatherTable == null) {
    // System.out.println("updateWeatherData : 'weather_table' ID를 가진 테이블을 찾을 수
    // 없습니다.");
    // return;
    // }

    // // 테이블에서 tbody의 모든 행 추출
    // Elements rows = weatherTable.select("tbody tr");

    // for (Element row : rows) {
    // String cityName = row.select("th").text();
    // Elements tds = row.select("td");
    // String scriptContent = row.select("script").html(); // <script> 태그 내용

    // if (tds.size() < 13) {
    // System.out.println("updateWeatherData : 데이터가 부족하여 건너뜁니다: " + cityName);
    // continue;
    // }

    // // 바람 속도를 script에서 추출
    // String windSpeed = extractWindSpeed(scriptContent);

    // // 날씨에 맞는 아이콘 선택
    // String weatherCondition = tds.get(0).text();
    // String weatherIcon = WeatherCondition.getIconByCondition(weatherCondition);
    // // enum을 사용하여 아이콘 반환

    // Map<String, String> weatherData = new HashMap<>();
    // weatherData.put("weather", weatherCondition.isEmpty() ? "-" :
    // weatherCondition); // 현재 일기
    // weatherData.put("temperature", tds.get(4).text().isEmpty() ? "-" :
    // tds.get(4).text()); // 현재 기온
    // weatherData.put("rainfall", tds.get(7).text().isEmpty() ? "-" :
    // tds.get(7).text()); // 강수
    // weatherData.put("humidity", tds.get(9).text().isEmpty() ? "-" :
    // tds.get(9).text()); // 습도
    // weatherData.put("windSpeed", windSpeed.isEmpty() ? "-" : windSpeed); // 바람 속도
    // weatherData.put("weather_icon", weatherIcon); // 아이콘 정보

    // weatherCache.put(cityName, weatherData);
    // }
    // System.out.println("updateWeatherData 대구 : " + weatherCache.get("대구"));
    // System.out.println("updateWeatherData : 날씨 데이터 업데이트 완료");
    // } catch (IOException e) {
    // System.err.println("updateWeatherData : 날씨 데이터를 가져오는 중 오류 발생: " +
    // e.getMessage());
    // }
    // }

    // 바람 속도를 추출하는 함수
    // private String extractWindSpeed(String scriptContent) {
    // String windSpeed = "";
    // if (scriptContent.contains("writeWindSpeed")) {
    // // writeWindSpeed('4.1', false, '', '', 1); 형태에서 '4.1' 값 추출
    // windSpeed = scriptContent.replaceAll(".*writeWindSpeed\\('([\\d.]+)'.*",
    // "$1");
    // }
    // return windSpeed;
    // }

    // public Map<String, String> getweatherData(String location) {
    // return weatherCache.getOrDefault(location, new HashMap<>());
    // }
}
