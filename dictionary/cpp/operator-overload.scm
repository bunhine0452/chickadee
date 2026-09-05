; 연산자에 뜻 붙이기. `+` 나 `<<` 가 무슨 일을 할지 **타입이 정한다** — `std::cout << x` 가
; 왜 되는지의 답이다 (`cpp.md` §4 #26).
((function_definition
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (operator_name) @pick.1 @hole
     parameters: (parameter_list) @pick.2)) @site
 (#set! form "opdef"))

((declaration
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (operator_name) @pick.1 @hole
     parameters: (parameter_list) @pick.2)) @site
 (#set! form "opdecl"))

((field_declaration
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (operator_name) @pick.1 @hole
     parameters: (parameter_list) @pick.2)) @site
 (#set! form "opfield"))

; 참조를 돌려주는 것 — 대입 연산자가 그 모양이다.
((field_declaration
   type: (_) @pick.3
   declarator: (reference_declarator
     (function_declarator
       declarator: (operator_name) @pick.1 @hole
       parameters: (parameter_list) @pick.2))) @site
 (#set! form "opref"))
