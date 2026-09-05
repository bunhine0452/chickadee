; 문장에 값 끼워 넣기. 문자열을 만드는 유일한 관용구가 매크로다 — `{}` 와 `{:?}` 가 다른
; 트레이트(`Display`·`Debug`)를 부른다.
;
; 매크로 몸통은 토큰 수프라(rs.md §8 ①) 안의 식은 안 보인다. 그래서 **문자열 리터럴 토큰만**
; 잡는다 — `token_tree` 의 직계 자식 `string_literal` 이다. 구멍은 `format` 이고 `println` 등은
; 짚기만 한다.
((macro_invocation
   macro: (identifier) @pick.1 @hole
   "!" @pick.3
   (token_tree (string_literal) @pick.2)) @site
 (#any-of? @pick.1 "format" "println" "print" "eprintln" "eprint" "write" "writeln" "panic"
   "assert" "assert_eq" "debug_assert" "info" "warn" "debug" "error" "trace" "anyhow" "bail")
 (#set! form "format"))
