package shop.cart;

class Accumulator {
    int sum(int[] values) {
        int total = 0;
        for (int v : values) {
            total = total + v;
        }
        return total;
    }
}
