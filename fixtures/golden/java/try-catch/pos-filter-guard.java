package com.ssafy.finalproject.security;

public class JwtAuthenticationFilter {
    void handle(Object request) {
        try {
            authenticate(request);
        } catch (IllegalStateException ex) {
            log(ex);
        }
    }
}
