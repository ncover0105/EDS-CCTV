package com.edscorp.eds.common.config;

import java.io.PrintWriter;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.edscorp.eds.security.UserAuthenticationFailureHandler;
import com.edscorp.eds.security.UserAuthenticationSuccessHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect;

@Configuration
@EnableWebSecurity(debug = false) // ✅ debug=true 는 로그가 너무 많아서 권장하지 않음
@Slf4j
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${spring.security.user.name}")
    private String username;

    @Value("${spring.security.user.password}")
    private String password;

    private final UserAuthenticationSuccessHandler successHandler;
    private final UserAuthenticationFailureHandler failureHandler;

    // 로그인 없이 접근 가능한 경로
    private static final String[] PUBLIC_URLS = {
            "/login", "/", "/error/**",
            "/css/**", "/js/**", "/favicon.ico",
            "/imgFiles/**", "/eds/**", "/images/**",
            "/hls/**", "/imgFiles/sailimg/**", "/imgFiles/radar/**",
            "/fonts/**", "/janus/**", "/ws/**", "/api/users/signup"
    };

    // 일반 사용자/관리자 모두 접근 가능한 경로
    private static final String[] USER_URLS = {
            "/main", "/home", "/menu/**", "/stream", "/stream/**", "/api/**"
    };

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("--------------------------------security config--------------------------------");

        http
                .httpBasic(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)

                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                .authorizeHttpRequests(authz -> authz
                        // ✅ 1) 누구나 접근
                        .requestMatchers(PUBLIC_URLS).permitAll()

                        // ✅ 2) "권한 변경"은 관리자만
                        .requestMatchers(HttpMethod.PUT, "/api/users/*/role").hasRole("MANAGER")

                        // ✅ 3) 나머지 USER 영역은 USER/MANAGER 모두 허용
                        .requestMatchers(USER_URLS).hasAnyRole("USER", "MANAGER")

                        .anyRequest().authenticated())

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/loginProc")
                        .usernameParameter("id")
                        .passwordParameter("pw")
                        .successHandler(successHandler)
                        .failureHandler(failureHandler)
                        .permitAll())

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .permitAll()
                        .logoutSuccessUrl("/login"));

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ⚠️ allowCredentials=true 이면 allowedOrigins="*" 조합은 브라우저에서 제한될 수 있음.
        // 문제가 생기면 setAllowedOriginPatterns(Arrays.asList("*"))로 변경 추천.
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private final AuthenticationEntryPoint unauthorizedEntryPoint = (request, response, authException) -> {
        ErrorResponse fail = new ErrorResponse(HttpStatus.UNAUTHORIZED, "Spring security unauthorized...");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        String json = new ObjectMapper().writeValueAsString(fail);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        PrintWriter writer = response.getWriter();
        writer.write(json);
        writer.flush();
    };

    private final AccessDeniedHandler accessDeniedHandler = (request, response, accessDeniedException) -> {
        ErrorResponse fail = new ErrorResponse(HttpStatus.FORBIDDEN, "Spring security forbidden...");
        response.setStatus(HttpStatus.FORBIDDEN.value());
        String json = new ObjectMapper().writeValueAsString(fail);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        PrintWriter writer = response.getWriter();
        writer.write(json);
        writer.flush();
    };

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Getter
    @RequiredArgsConstructor
    public class ErrorResponse {
        private final HttpStatus status;
        private final String message;
    }

    @Bean
    LayoutDialect layoutDialect() {
        return new LayoutDialect();
    }
}