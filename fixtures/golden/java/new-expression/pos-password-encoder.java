package com.ssafy.finalproject.config;

public class SecurityConfig {
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
