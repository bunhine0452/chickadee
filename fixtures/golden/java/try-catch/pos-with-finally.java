package com.ssafy.finalproject.service;

public class FileService {
    void save(String path) {
        try {
            write(path);
        } catch (RuntimeException e) {
            log(e);
        } finally {
            close();
        }
    }
}
