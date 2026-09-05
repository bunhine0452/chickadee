package shop.cart;

import java.util.List;

class Basket {
    boolean isReady(List<String> items) {
        if (!items.isEmpty()) {
            return true;
        }
        return false;
    }
}
