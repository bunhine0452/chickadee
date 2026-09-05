package com.ssafy.finalproject.doc;

public class Snippet {
    private String sample = "try { risky(); } catch (Exception e) { }";
    private String block = """
        try {
            risky();
        } catch (IllegalStateException e) {
        }
        """;

    void run() {
        try {
            risky();
        } catch (Exception e) {
            log(e);
        }
    }
}
