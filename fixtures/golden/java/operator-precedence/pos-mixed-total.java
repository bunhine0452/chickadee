package shop.pricing;

class Bill {
    int total(int base, int unit, int count) {
        int sum = base + unit * count;
        return sum;
    }
}
