package com.ssafy.finalproject.service;

public class Calc {
    int total(int n) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += i;
        }
        return sum;
    }
}
