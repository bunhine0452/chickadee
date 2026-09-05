package com.ssafy.finalproject.service;

import java.util.List;

public class NoticeService {
    public void show(List<String> titles) {
        titles.forEach(title -> print(title));
        titles.forEach(System.out::println);
    }
}
