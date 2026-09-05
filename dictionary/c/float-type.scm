; 실수는 왜 안 떨어지나. 보이는 자리 넷 — 실수 리터럴이 낀 셈 · double 리터럴을 float 에 넣는
; 선언(두 번 잘린다) · double 리터럴 선언 · 실수를 같음 기호로 견주는 자리.
; 정규식에 역슬래시를 안 쓴다 — 소수점은 `[.]` 다.
((binary_expression
   left: (number_literal) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (_) @pick.3) @site
 (#match? @pick.2 "[.eE]")
 (#set! form "floatop"))

((binary_expression
   left: [(identifier) (call_expression) (field_expression) (subscript_expression) (parenthesized_expression)] @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.3 "^[0-9]*[.]")
 (#set! form "floatop"))

; `float f = 0.1;` — 오른쪽은 double 이라 float 상자에 들어가며 **한 번 더** 잘린다 (c.md §0.1 #6).
((declaration
   type: (primitive_type) @pick.1
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.3)) @site
 (#eq? @pick.1 "float")
 (#match? @pick.3 "[.]")
 (#not-match? @pick.3 "[fF]$")
 (#set! form "narrowed"))

((declaration
   type: (primitive_type) @pick.1
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.3)) @site
 (#eq? @pick.1 "double")
 (#match? @pick.3 "[.]")
 (#set! form "floatlit"))

((binary_expression
   left: (_) @pick.2
   operator: ["==" "!="] @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.3 "[.]")
 (#set! form "floateq"))
