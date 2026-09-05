package shop.report;

class Header {
    String build(String title, int day) {
        String head = "day " + day;
        return head + title;
    }
}
