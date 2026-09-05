package com.ssafy.finalproject.security;

public class JwtUtil {
    Date expiry(long millis) {
        Date now = new Date();
        return new Date(now.getTime() + millis);
    }
}
