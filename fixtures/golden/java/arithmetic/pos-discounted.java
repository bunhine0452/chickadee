package shop.pricing;

class Discount {
    double apply(double amount, double rate) {
        double cut = amount * rate;
        return amount - cut;
    }
}
