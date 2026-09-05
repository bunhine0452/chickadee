package shop.config;

class FeatureFlag {
    private boolean enabled = false;

    void enable() {
        this.enabled = true;
    }
}
