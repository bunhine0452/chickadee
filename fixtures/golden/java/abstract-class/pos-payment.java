package com.ssafy.finalproject.payment;

public abstract class Payment {
    public long fee(long amount) {
        return amount / 100;
    }

    public abstract boolean authorize(long amount);
}
