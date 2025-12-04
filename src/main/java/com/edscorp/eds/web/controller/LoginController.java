package com.edscorp.eds.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String showLoginPage() {
        return "page/loginPage";
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

}
