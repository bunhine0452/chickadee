package shop.order;

class Retry {
    void run(boolean pending) {
        while (pending) {
            pending = step();
        }
    }

    boolean step() {
        return false;
    }
}
