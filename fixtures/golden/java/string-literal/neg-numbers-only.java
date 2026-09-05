package shop.stock;

class Counter {
    private int seen;

    int bump(int by) {
        int next = seen + by;
        return next;
    }
}
