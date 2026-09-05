package shop.stock;

class Threshold {
    boolean low(int left, int floorAt) {
        boolean under = left < floorAt;
        return under;
    }
}
