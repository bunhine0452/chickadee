package com.ssafy.finalproject.util;

import java.util.List;

public class Totals {
    public double sum(List<? extends Number> xs) {
        double total = 0;
        for (Number x : xs) total += x.doubleValue();
        return total;
    }
}
