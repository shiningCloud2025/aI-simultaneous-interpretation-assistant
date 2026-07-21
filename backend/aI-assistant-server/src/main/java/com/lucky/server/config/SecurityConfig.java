package com.lucky.server.config;

import com.lucky.server.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security配置
 * @author shiningCloud2025
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 关闭 CSRF（JWT 无状态）
                .csrf(AbstractHttpConfigurer::disable)
                // 无 Session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 请求认证配置
                .authorizeHttpRequests(auth -> auth
                        // 放行路径
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/asia/audio",                    // WebSocket
                                "/doc.html",                      // Knife4j
                                "/webjars/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/favicon.ico"
                        ).permitAll()
                        // 其余暂时先全放行
                        .anyRequest().permitAll()
                )

                // JWT 过滤器加在 UsernamePasswordAuthenticationFilter 前面
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private final JwtAuthFilter jwtAuthFilter;
}
