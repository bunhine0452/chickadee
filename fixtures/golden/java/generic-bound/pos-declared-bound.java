package com.ssafy.finalproject.util;

public class Stat<T extends Number> {
    private T value;

    public double doubled() {
        return value.doubleValue() * 2;
    }
}
