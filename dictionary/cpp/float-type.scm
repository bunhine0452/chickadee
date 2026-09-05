; 실수는 왜 안 떨어지나. 두 자리에서 보인다 — 실수 타입으로 이름을 세운 곳과,
; 소수 리터럴이 낀 셈. 요점은 **저장되는 값이 이미 근사값**이라는 것이다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1 "double" "float")
 (#set! form "floatdecl"))

; 소수 리터럴 둘로 만든 셈. `0.1 + 0.2` 가 그 자리다.
((binary_expression
   left: (number_literal) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.2 "\\.")
 (#set! form "floatop"))

; 매개변수로 받는 실수 — 부르는 쪽이 준 값도 이미 근사값이다.
((parameter_declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#any-of? @pick.1 "double" "float")
 (#set! form "floatparam"))
