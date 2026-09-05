package com.ssafy.finalproject.security;

public class JwtUtil {
    private String secretKey;
    private long expiration;

    public String key() {
        return secretKey;
    }
}
