package com.ssafy.finalproject.util;

public class Sum {
    public int total(int[] values) {
        int sum = 0;
        for (int v : values) sum += v;
        return sum;
    }
}
