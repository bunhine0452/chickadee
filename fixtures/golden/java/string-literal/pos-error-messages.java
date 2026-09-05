package shop.order;

class OrderError {
    private String code = "ORDER_NOT_FOUND";

    String describe() {
        String message = "order is missing";
        return message;
    }
}
