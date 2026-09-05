; 함수를 값으로 담기. 선언이 안에서 밖으로 읽힌다 — `int (*f)(int)` 는 「`f` 는 포인터, 가리키는 것은
; `int` 하나 받아 `int` 를 내는 함수」다. 선언자가 `function_declarator(parenthesized_declarator(
; pointer_declarator))` 로 겹쳐 있는 것이 그 모양이다. 부르는 자리는 `(*f)(x)` 로 짚는다.
((declaration
   type: (_) @pick.1
   declarator: (function_declarator
     declarator: (parenthesized_declarator (pointer_declarator declarator: (identifier) @pick.2))
     parameters: (parameter_list) @pick.3)) @site
 (#set! form "declare"))

((declaration
   type: (_) @pick.1
   declarator: (init_declarator
     declarator: (function_declarator
       declarator: (parenthesized_declarator (pointer_declarator declarator: (identifier) @pick.2))
       parameters: (parameter_list) @pick.3)
     value: (_))) @site
 (#set! form "declare-init"))

((type_definition
   type: (_) @pick.1
   declarator: (function_declarator
     declarator: (parenthesized_declarator (pointer_declarator declarator: (type_identifier) @pick.2))
     parameters: (parameter_list) @pick.3)) @site
 (#set! form "typedef"))

((parameter_declaration
   type: (_) @pick.1
   declarator: (function_declarator
     declarator: (parenthesized_declarator (pointer_declarator declarator: (identifier) @pick.2))
     parameters: (parameter_list) @pick.3)) @site
 (#set! form "param"))

((call_expression
   function: (parenthesized_expression (pointer_expression operator: "*" @pick.1 argument: (identifier) @pick.2))
   arguments: (argument_list) @pick.3) @site
 (#set! form "call-deref"))
