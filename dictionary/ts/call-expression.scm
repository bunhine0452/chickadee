; `f(...)` — 괄호가 붙는 순간 함수가 실제로 돈다.
; `new F()` 는 `new_expression` 이라 여기 걸리지 않는다.
((call_expression
   function: (_) @pick.1
   arguments: (arguments) @pick.2) @site
 (#set! form "call"))
