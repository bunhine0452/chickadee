package shop.order;

class Shipping {
    boolean free(int total) {
        boolean big = total >= 50000;
        return big;
    }
}
