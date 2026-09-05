; 적힌 숫자는 **타입 없는 상수**이고, 이름에 담기는 순간 폭이 정해진다.
; 잡는 자리는 그 「담기는 순간」 셋이다 — 타입을 적은 선언 · 타입을 안 적은 짧은 선언 ·
; 상수 선언. 셋의 차이가 그대로 판의 내용이다.
((var_spec
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole
   value: (expression_list (int_literal) @pick.3)) @site
 (#any-of? @pick.1 "int" "int8" "int16" "int32" "int64" "uint" "uint8" "uint16" "uint32" "uint64" "byte" "rune" "uintptr")
 (#set! form "vardecl"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (int_literal) @pick.3 .)) @site
 (#set! form "short"))

((const_spec
   name: (identifier) @pick.2
   value: (expression_list . (int_literal) @pick.3 .)) @site
 (#set! form "const"))
