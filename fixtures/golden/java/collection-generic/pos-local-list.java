package com.ssafy.finalproject.security;

public class Authorities {
    Object build(String role) {
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(role);
        return authorities;
    }
}
