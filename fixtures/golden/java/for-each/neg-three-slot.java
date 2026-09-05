package com.ssafy.finalproject.util;

public class Counter {
    public int upTo(int n) {
        int total = 0;
        for (int i = 0; i < n; i++) {
            total += i;
        }
        return total;
    }
}
