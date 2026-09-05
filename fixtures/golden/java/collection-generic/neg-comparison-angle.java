package com.ssafy.finalproject.service;

public class Calc {
    boolean between(int a, int b, int c) {
        boolean low = a < b;
        boolean high = b > c;
        return low && high;
    }
}
