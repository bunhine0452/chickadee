package com.ssafy.finalproject.model.entity;

import java.util.Objects;

public class User {
    private long id;

    @Override
    public boolean equals(Object o) {
        return o instanceof User && ((User) o).id == id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
