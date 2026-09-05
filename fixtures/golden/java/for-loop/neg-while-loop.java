package com.ssafy.finalproject.service;

public class Calc {
    int total(int n) {
        int sum = 0;
        int i = 0;
        while (i < n) {
            sum += i;
            i++;
        }
        return sum;
    }
}
