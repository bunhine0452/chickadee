package shop.stock;

class StockLedger {
    private short warehouseId;

    void apply(long delta) {
        long total = delta;
        record(total);
    }

    void record(long value) {
    }
}
