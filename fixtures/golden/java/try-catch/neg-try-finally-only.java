package com.ssafy.finalproject.service;

public class FileService {
    void save(String path) {
        try {
            write(path);
        } finally {
            close();
        }
    }
}
