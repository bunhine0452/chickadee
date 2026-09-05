package com.ssafy.finalproject.service;

public class FileService {
    void save(String path) {
        write(path);
        close();
    }
}
