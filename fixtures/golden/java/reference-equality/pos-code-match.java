package shop.order;

class CodeMatch {
    boolean isCancelled(String status) {
        boolean same = status.equals("CANCELLED");
        return same;
    }
}
