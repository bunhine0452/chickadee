package com.ssafy.finalproject.security;

public class JwtAuthenticationFilter {
    String bearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null) {
            return null;
        }
        return header;
    }
}
