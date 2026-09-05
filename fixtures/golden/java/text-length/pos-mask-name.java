package shop.user;

class Masker {
    String mask(String name) {
        if (name.length() == 1) {
            return name;
        }
        return name.substring(0, name.length() - 1) + "*";
    }
}
