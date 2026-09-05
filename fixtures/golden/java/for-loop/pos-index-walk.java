package com.ssafy.finalproject.service;

public class Report {
    String join(List<String> rows) {
        String out = "";
        for (int i = 0; i < rows.size(); i = i + 1) {
            out = out + rows.get(i);
        }
        return out;
    }
}
