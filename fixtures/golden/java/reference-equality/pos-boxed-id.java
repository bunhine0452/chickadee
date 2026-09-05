package shop.order;

class Owner {
    boolean owns(Long userId, Long orderOwner) {
        return userId.equals(orderOwner);
    }
}
