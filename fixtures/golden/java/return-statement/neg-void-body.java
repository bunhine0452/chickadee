package com.ssafy.finalproject.config;

public class WebConfig {
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("http://localhost:5173");
    }
}
