; 기다리지 않고 띄우기. 이름 없는 함수를 띄우는 것과 이름 붙은 것을 갈라 잡는다.
((go_statement
   "go" @pick.1 @hole
   (call_expression
     function: (func_literal parameters: (parameter_list) @pick.2 body: (block) @pick.3)
     arguments: (argument_list) @pick.4)) @site
 (#set! form "lit"))

((go_statement
   "go" @pick.1 @hole
   (call_expression
     function: (identifier) @pick.2
     arguments: (argument_list) @pick.3)) @site
 (#set! form "call"))

((go_statement
   "go" @pick.1 @hole
   (call_expression
     function: (selector_expression field: (field_identifier) @pick.2)
     arguments: (argument_list) @pick.3)) @site
 (#set! form "method"))
