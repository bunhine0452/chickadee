package shop.audit;

class Audit {
    void record(Logger log) {
        String action = "checkout";
        log.info("cart closed");
        log.info(action);
    }
}

class Logger {
    void info(String line) {
    }
}
