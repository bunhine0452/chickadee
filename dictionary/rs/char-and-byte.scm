; 문자와 바이트. `.len()` 은 바이트 수라 `"가".len() == 3` 이고, 글자를 세려면 `.chars()` 다.
;
; `.len()` 은 **문자열 리터럴에 부른 것만** 잡는다 — 이름에 부른 918곳은 수신자가 Vec 인지
; String 인지 그 줄에 안 적혀 있다 (rs.md §0.7 ③ · 파이썬 `py/text-length` 와 같은 결정).
; `.chars()`·`.bytes()`·`.as_bytes()` 는 문자열에만 있는 메서드라 이름 수신자도 잡는다.
((let_declaration
   "let" @pick.1
   pattern: (identifier) @pick.2
   value: (char_literal) @pick.3) @site
 (#set! form "char-let"))

((call_expression
   function: (field_expression
     value: (string_literal) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "len" "chars" "bytes" "as_bytes" "char_indices")
 (#set! form "text-of-literal"))

((call_expression
   function: (field_expression
     value: [(identifier) (field_expression)] @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "chars" "bytes" "as_bytes" "char_indices")
 (#set! form "text-walk"))

((parameter
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#eq? @pick.1 "char")
 (#set! form "char-param"))
