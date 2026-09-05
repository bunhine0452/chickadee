package shop.user;

class NameCheck {
    boolean filled(String name) {
        boolean ok = name != null && name.length() > 0;
        return ok;
    }
}
