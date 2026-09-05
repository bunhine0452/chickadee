package com.ssafy.finalproject.service;

public class AuthService {
    boolean ok(String id, String pw) {
        return id != null && pw != null;
    }
}
