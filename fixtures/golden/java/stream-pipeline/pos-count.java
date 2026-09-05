package com.ssafy.finalproject.service;

import java.util.List;

public class RankingService {
    public long howMany(List<Dream> dreams) {
        return dreams.stream().filter(Dream::isPublic).count();
    }
}
