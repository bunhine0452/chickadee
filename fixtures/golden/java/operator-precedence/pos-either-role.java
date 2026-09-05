package shop.auth;

class Role {
    boolean allowed(boolean admin, boolean owner) {
        if (admin || owner) {
            return true;
        }
        return false;
    }
}
