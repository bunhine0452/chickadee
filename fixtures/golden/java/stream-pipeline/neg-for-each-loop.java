package com.ssafy.finalproject.service;

import java.util.List;

public class DreamService {
    public void show(List<Dream> dreams) {
        for (Dream d : dreams) {
            print(d.getTitle());
        }
    }
}
