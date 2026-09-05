package shop.mail;

class Greeting {
    private String subject = "hello";

    String render(String name) {
        String body = "hi " + name;
        return body;
    }
}
