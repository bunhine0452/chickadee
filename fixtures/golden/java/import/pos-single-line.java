package com.ssafy.finalproject.security;

import io.jsonwebtoken.Jwts;

public class TokenReader {
    public Object parse(String token) {
        return Jwts.parser();
    }
}
