package com.ssafy.finalproject.service;

import java.util.Optional;

public class UserService {
    public User find(Optional<User> found) {
        return found.orElseThrow(() -> new ResourceNotFoundException("user"));
    }
}
