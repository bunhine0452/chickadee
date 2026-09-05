package shop.user;

class Session {
    void open(boolean remember) {
        boolean sticky = remember && true;
        store(sticky);
    }

    void store(boolean value) {
    }
}
