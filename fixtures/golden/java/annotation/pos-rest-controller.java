package com.ssafy.finalproject.controller;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @PostMapping("/login")
    public String login() {
        return "ok";
    }
}
