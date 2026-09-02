; setX((prev) => …) — 이전 값을 받아 새 값을 돌려주는 갱신. TS 판.
; TS 문법은 괄호 매개변수를 `required_parameter` 로 감싸고 JS 는 `identifier` 를 그대로 둔다.
; 구조가 달라 컴파일이 갈리므로 파일을 나눈다 (03 §3.2).
((call_expression
   function: (identifier) @ctx.setter
   arguments: (arguments . (arrow_function
     parameters: (formal_parameters (required_parameter pattern: (identifier) @pick.1))
     body: (_) @pick.2))) @site
 (#match? @ctx.setter "^set[A-Z]")
 (#set! form "paren"))

; 괄호 없는 한 개 매개변수 — `setX(prev => …)`.
((call_expression
   function: (identifier) @ctx.setter
   arguments: (arguments . (arrow_function
     parameter: (identifier) @pick.1
     body: (_) @pick.2))) @site
 (#match? @ctx.setter "^set[A-Z]")
 (#set! form "bare"))
