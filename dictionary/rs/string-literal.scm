; 글자 값. 큰따옴표의 타입이 `String` 이 아니라 `&'static str` 이다 — 그래서 소유한 글자가
; 필요하면 `.to_string()` 을 붙인다. 그 붙이는 자리가 이 개념의 둘째 패턴이다.
((let_declaration
   "let" @pick.1
   pattern: (identifier) @pick.2
   value: (string_literal) @pick.3) @site
 (#set! form "str-let"))

((call_expression
   function: (field_expression
     value: (string_literal) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "to_string" "to_owned" "into")
 (#set! form "str-own"))

; `const NAME: &str = "…";` — 프로그램이 도는 내내 사는 글자. 타입이 적혀 있는 유일한 자리.
((const_item
   name: (identifier) @pick.2
   type: (_) @pick.1
   value: (string_literal) @pick.3) @site
 (#set! form "str-const"))
