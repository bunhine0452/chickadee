package com.ssafy.finalproject.service;

import java.util.List;
import java.util.stream.Collectors;

public class MonthlyAnalysisService {
    public List<String> titles(List<Dream> dreams) {
        return dreams.stream()
                .map(Dream::getTitle)
                .collect(Collectors.toList());
    }
}
