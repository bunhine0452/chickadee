; 소수가 2진수로 안 떨어지는 것이 보이는 자리 — 실수 리터럴이 든 선언과 셈, 그리고
; **실수 타입이 적힌 칸**.
;
; 마지막 형태를 넣은 이유가 실측이다: `cli/cli` 429파일에서 실수 리터럴이 든 선언·셈이
; **한 곳**뿐이다(CLI 도구라 셈이 없다). 리터럴만 잡으면 이 판은 사실상 부재가 된다.
((var_spec
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole
   value: (expression_list (float_literal) @pick.3)) @site
 (#any-of? @pick.1 "float64" "float32")
 (#set! form "vardecl"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (float_literal) @pick.3 .)) @site
 (#set! form "short"))

((binary_expression
   left: (float_literal) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "floatop"))

((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (float_literal) @pick.3) @site
 (#set! form "floatop"))

((parameter_declaration
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole) @site
 (#any-of? @pick.1 "float64" "float32")
 (#set! form "param"))
