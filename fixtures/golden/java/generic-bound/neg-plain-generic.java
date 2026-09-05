package com.ssafy.finalproject.model.dto;

import java.util.List;

public class Page<T> {
    private List<T> items;

    public List<T> items() {
        return items;
    }
}
