package shop.mail;

class Subject {
    String of(String topic) {
        String line = "re: " + topic;
        return line;
    }
}
