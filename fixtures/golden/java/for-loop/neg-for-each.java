package com.ssafy.finalproject.service;

public class Report {
    String join(List<String> rows) {
        String out = "";
        for (String row : rows) {
            out = out + row;
        }
        return out;
    }
}
