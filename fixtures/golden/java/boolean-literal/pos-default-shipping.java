package shop.order;

class Shipping {
    boolean freeFor(int total) {
        if (total > 50000) {
            return true;
        }
        return false;
    }
}
