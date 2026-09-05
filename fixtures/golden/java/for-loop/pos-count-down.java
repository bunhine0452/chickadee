package com.ssafy.finalproject.service;

public class Calc {
    int down(int n) {
        int sum = 0;
        for (int i = n; i > 0; i--) sum += i;
        return sum;
    }
}
