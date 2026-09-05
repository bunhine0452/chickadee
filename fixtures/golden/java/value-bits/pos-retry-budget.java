package shop.order;

class RetryBudget {
    private int attempts;
    private long backoffMillis;

    void arm(int limit) {
        int remaining = limit;
        this.attempts = remaining;
        this.backoffMillis = 200L;
    }
}
