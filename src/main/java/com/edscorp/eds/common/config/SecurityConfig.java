package com.edscorp.eds.common.config;

import java.io.PrintWriter;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
@EnableWebSecurity(debug = true)
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
            "/login", "/", "/error/**", "/css/**", "/js/**", "/favicon.ico", "/imgFiles/**", "/eds/**", "/images/**",
            "/hls/**", "/imgFiles/sailimg/**", "/imgFiles/radar/**", "/fonts/**", "/janus/**", "/ws/**"

    };

    private static final String[] USER_URLS = {
            "/main", "/home", "/menu/**", "/stream", "/stream/**", "/api/**",
    };

    // @Autowired
    // private SessionInterceptor sessioninterceptor;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("--------------------------------security config--------------------------------");
        http
                .httpBasic(AbstractHttpConfigurer::disable) // Http 기본 인증 비활성화
                .csrf((csrf) -> csrf.disable()) // CSRF 설정 (사이트 위변조 요청 방지)

                .headers(headerConfig -> headerConfig
                        .frameOptions(frameOptionsConfig -> frameOptionsConfig
                                .disable()))

                .sessionManagement(sessionManagement -> sessionManagement
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // 인증절차 설정
                .authorizeHttpRequests((authz) -> authz
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        .requestMatchers(USER_URLS).hasRole("USER")
                        .anyRequest().authenticated() // 나머지 요청은 인증 필요
                )

                // 401 403 관련 예외처리
                .exceptionHandling((exceptionHandling) -> exceptionHandling
                        .authenticationEntryPoint(unauthorizedEntryPoint).accessDeniedHandler(accessDeniedHandler))

                // 로그인 설정
                .formLogin((form) -> form
                        .loginPage("/login") // 로그인 Url, default: /login
                        .usernameParameter("id")
                        .passwordParameter("pw")
                        .loginProcessingUrl("/loginProc") // 로그인 Form Action Url
                        .defaultSuccessUrl("/main") // 로그인 성공 후 메인 페이지로 이동
                        .successHandler(successHandler)
                        .failureHandler(failureHandler)
                        .permitAll())

                // 로그아웃 설정
                .logout((logout) -> logout
                        .logoutUrl("/logout")
                        .permitAll()
                        .logoutSuccessUrl("/login"));

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
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

    // @Bean
    // UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
    // log.info("userDetailsService :: id :" + username + " / pw :" + password);
    // UserDetails user = User.withUsername(username)
    // .password(passwordEncoder.encode(password))
    // .roles("USER")
    // .build();

    // return new InMemoryUserDetailsManager(user);
    // }

    @Bean
    LayoutDialect layoutDialect() {
        return new LayoutDialect();
    }
}
