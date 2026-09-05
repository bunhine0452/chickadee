package shop.audit;

class Audit {
    String line(int orderId) {
        String message = "order=" + orderId;
        return message;
    }
}
