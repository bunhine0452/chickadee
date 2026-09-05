package com.ssafy.finalproject.security;

// 옛 판에서는 catch (Exception e) 로 통째로 삼켰다.
/* 사양 초안:
 *   try { getClaims(token); } catch (JwtException e) { return false; }
 *   catch (IllegalArgumentException e) { return false; }
 */
public class JwtUtil {
    public boolean validate(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
