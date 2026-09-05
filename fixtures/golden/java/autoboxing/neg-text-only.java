package shop.mail;

class Subject {
    private String topic = "sale";

    String of(String prefix) {
        String line = prefix + topic;
        return line;
    }
}
