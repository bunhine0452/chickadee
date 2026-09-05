; 암묵·명시·잘림. 자리 셋 — 사람이 적은 캐스트(잘려도 조용) · 부호 없는 리터럴과의 견주기
; (`-1 < 1u` 가 거짓) · 정수와 실수 리터럴이 만나는 셈(정수가 올라간다).
; 넓히기 일반(`long l = i;`)은 양쪽 타입을 알아야 해서 정적으로 못 본다 — 합성이 정본이다.
((cast_expression
   "(" @pick.2
   type: (type_descriptor) @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "explicit"))

((binary_expression
   left: (_) @pick.2
   operator: ["<" ">" "<=" ">=" "==" "!="] @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.3 "[uU]")
 (#set! form "implicit-unsigned"))

((binary_expression
   left: (number_literal) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.2 "^-?[0-9]+$")
 (#match? @pick.3 "[.]")
 (#set! form "promote"))
