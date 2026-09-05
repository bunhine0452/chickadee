package com.ssafy.finalproject.util;

public class Scores {
    private int[] daily = new int[7];

    public int at(int day) {
        return daily[day];
    }
}
