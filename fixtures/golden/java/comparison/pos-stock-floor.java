package shop.stock;

class Floor {
    boolean low(int left, int floorAt) {
        boolean under = left < floorAt;
        return under;
    }
}
