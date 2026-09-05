package com.ssafy.finalproject.service;

public class CoinService {
    public void resetDailyCoinIfNeeded(User user) {
        if (user.isResetToday()) {
            return;
        }
        user.resetCoin();
    }
}
