package com.ssafy.finalproject.config;

public class WebConfig {
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Bean
    public String dir() {
        return uploadDir;
    }
}
