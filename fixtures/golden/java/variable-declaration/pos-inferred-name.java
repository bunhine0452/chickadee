package shop.report;

class DailyReport {
    void build() {
        var title = "daily";
        double average = 7 / 2;
        emit(title, average);
    }

    void emit(String title, double value) {
    }
}
