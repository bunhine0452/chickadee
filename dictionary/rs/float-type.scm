; 실수는 왜 안 떨어지나. `f64` 가 `Ord` 가 아니라는 것까지가 이 개념이다 —
; `sort()` 가 안 되고 `partial_cmp` 를 손으로 부르는 자리가 그 증거다.
((let_declaration
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole
   value: (_) @pick.3) @site
 (#match? @pick.1 "^f(32|64)$")
 (#set! form "float-let"))

((parameter
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#match? @pick.1 "^f(32|64)$")
 (#set! form "float-param"))

((field_declaration
   name: (field_identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#match? @pick.1 "^f(32|64)$")
 (#set! form "float-field"))

; 실수 리터럴끼리의 셈 — `0.1 + 0.2`. 값이 10진수로 안 떨어지는 것을 보이는 자리.
((binary_expression
   left: (float_literal) @pick.2
   operator: _ @pick.1
   right: (float_literal) @pick.3) @site
 (#set! form "float-op"))

; `a.partial_cmp(b)` — NaN 때문에 순서가 「있을 수도 없을 수도」라 견주기가 Option 을 낸다.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "partial_cmp")
 (#set! form "partial-cmp"))
