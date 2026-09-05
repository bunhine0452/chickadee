package shop.report;

class Preview {
    String shorten(String body) {
        int size = body.length();
        if (size > 50) {
            return body.substring(0, 50);
        }
        return body;
    }
}
