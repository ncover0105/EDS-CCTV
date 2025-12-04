package com.edscorp.eds.rainfall.controller.crawling;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
public class CrawlerController {

    @Autowired
    private WebCrawlerService webCrawlerService;

    // 실시간 강우량
    @PostMapping("/crawl")
    @ResponseBody
    public List<Map<String, Object>> crawl(@RequestBody Map<String, String> requestBody) {
        String url = requestBody.get("url");
        System.out.println(url);
        return webCrawlerService.crawlUrl(url);
    }

    // 날씨 데이터 (기상청)
    // @GetMapping("/weather")
    // @ResponseBody
    // public Map<String, String> getweather() {
    //     return webCrawlerService.getweatherData("대구");
    // }
    
}