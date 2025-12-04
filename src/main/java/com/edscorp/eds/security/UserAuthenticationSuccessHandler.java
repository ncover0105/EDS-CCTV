package com.edscorp.eds.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.edscorp.eds.common.domain.UserLoginLogEntity;
import com.edscorp.eds.user.repository.UserLoginLogRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserLoginLogRepository userLoginLogRepository;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        log.info("--------------------------------UserAuthenticationSuccessHandler--------------------------------");
        log.info("UserAuthenticationSuccessHandler :: " + authentication.getName());

        String userId = authentication.getName();
        String ip = getClientIp(request);

        userLoginLogRepository.save(
                UserLoginLogEntity.builder()
                        .userId(userId)
                        .loginIp(ip)
                        .build());

        response.sendRedirect("/main");
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
