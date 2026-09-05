package com.ssafy.finalproject.service;

import java.util.List;
import java.util.Map;

public class RankingService {
    public void fill(List<Map<String, Object>> rawRankings) {
        for (Map<String, Object> row : rawRankings) {
            row.put("rank", 1);
        }
    }
}
