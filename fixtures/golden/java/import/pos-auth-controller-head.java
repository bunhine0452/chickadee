package com.ssafy.finalproject.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import com.ssafy.finalproject.model.dto.request.LoginRequest;

public class AuthController {
    public ResponseEntity<LoginRequest> login(LoginRequest request) {
        return ResponseEntity.ok(request);
    }
}
