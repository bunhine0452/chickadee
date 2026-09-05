package shop.user;

class Nickname {
    boolean same(String left, String right) {
        if (left != null && left.equals(right)) {
            return true;
        }
        return false;
    }
}
