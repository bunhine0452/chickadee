package shop.user;

class Lookup {
    String nameOf(String raw) {
        if (raw != null) {
            String trimmed = raw.trim();
            return trimmed;
        }
        String fallback = "unknown";
        return fallback;
    }
}
