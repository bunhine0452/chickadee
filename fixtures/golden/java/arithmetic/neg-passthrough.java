package shop.user;

class Passthrough {
    String echo(String given) {
        String kept = given;
        return kept;
    }
}
