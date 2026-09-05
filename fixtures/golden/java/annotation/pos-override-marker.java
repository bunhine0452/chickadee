package com.ssafy.finalproject.security;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(Object request) {
        handle(request);
    }
}
