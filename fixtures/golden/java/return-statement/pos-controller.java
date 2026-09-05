package com.ssafy.finalproject.controller;

public class AuthController {
    public ResponseEntity<LoginResponse> login(LoginRequest request) {
        LoginResponse body = authService.login(request);
        return ResponseEntity.ok(body);
    }
}
