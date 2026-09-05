package com.ssafy.finalproject.model.dao;

interface CommentDao {
    void insert(String body);

    void delete(long id);
}
