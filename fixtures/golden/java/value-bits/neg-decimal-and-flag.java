package shop.pricing;

class Discount {
    private double rate;
    private boolean active;

    double applyTo(double amount) {
        double cut = amount * rate;
        return amount - cut;
    }
}
