package com.ssafy.finalproject.security;

public class Claims {
    private Map<String, Object> values = null;

    Object read(String key) {
        return values.get(key);
    }
}
