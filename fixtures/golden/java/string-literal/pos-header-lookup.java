package shop.web;

import java.util.Map;

class Headers {
    String tokenOf(Map<String, String> headers) {
        return headers.get("Authorization");
    }
}
