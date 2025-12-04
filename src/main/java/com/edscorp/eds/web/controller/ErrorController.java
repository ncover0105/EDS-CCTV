package com.edscorp.eds.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping(value = "/error")
public class ErrorController {

    @GetMapping("/401")
    public String unauthorized() {
        return "401";
    }

    @GetMapping("/404")
    public String notFound() {
        return "404";
    }

    @GetMapping("/500")
    public String internalServerError() {
        return "500";
    }

}
