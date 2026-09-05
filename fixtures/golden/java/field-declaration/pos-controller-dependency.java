package com.ssafy.finalproject.controller;

public class AuthController {
    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }
}
