; 식은 왼쪽부터 읽히지 않는다 — 센 연산자가 먼저 접힌다. 그 접힘이 코드에 보이는 자리는
; **세기가 다른 둘이 괄호 없이 섞인 곳**이다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-"] @pick.1
   right: (binary_expression operator: ["*" "/" "%"]) @pick.3) @site
 (#set! form "mul-right"))

((binary_expression
   left: (binary_expression operator: ["*" "/" "%"]) @pick.3
   operator: ["+" "-"] @pick.1
   right: [(number) (identifier) (member_expression) (call_expression)] @pick.2) @site
 (#set! form "mul-left"))

; `a || b && c` — `&&` 가 `||` 보다 세다. 괄호가 없으면 `a || (b && c)` 로 접힌다.
((binary_expression
   left: (_) @pick.2
   operator: "||" @pick.1
   right: (binary_expression operator: "&&" @hole) @pick.3) @site
 (#set! form "and-first"))
