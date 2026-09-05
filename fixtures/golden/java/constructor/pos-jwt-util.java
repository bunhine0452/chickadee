package com.ssafy.finalproject.security;

public class JwtUtil {
    private String secret;

    public JwtUtil(String secret) {
        this.secret = secret;
    }
}
