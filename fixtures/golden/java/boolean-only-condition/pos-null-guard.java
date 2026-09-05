package shop.user;

class NameGuard {
    String show(String name) {
        if (name != null) {
            return name;
        }
        return "guest";
    }
}
