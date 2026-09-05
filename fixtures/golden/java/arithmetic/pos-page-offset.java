package shop.catalog;

class Paging {
    int offset(int page, int size) {
        int skip = page * size;
        int rest = skip % 10;
        return skip - rest;
    }
}
