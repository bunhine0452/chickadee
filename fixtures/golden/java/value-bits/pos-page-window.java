package shop.catalog;

class PageWindow {
    byte pageSize;

    int offsetOf(int page) {
        int size = 20;
        return page * size;
    }
}
