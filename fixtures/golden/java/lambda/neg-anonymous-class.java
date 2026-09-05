package com.ssafy.finalproject.config;

public class WebConfig {
    public Runnable task() {
        return new Runnable() {
            public void run() {
                print(1);
            }
        };
    }
}
