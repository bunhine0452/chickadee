; 값으로서의 함수. 이름에 담는 자리와 인자로 넘기는 자리를 잡는다.
; `go func(){}()` 는 안 잡는다 — 그 자리는 `go/goroutine` 의 것이다.
((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (func_literal
     "func" @pick.1 @hole
     parameters: (parameter_list) @pick.3
     body: (block) @pick.4) .)) @site
 (#set! form "bind"))

((call_expression
   function: (_) @pick.2
   arguments: (argument_list (func_literal
     "func" @pick.1 @hole
     parameters: (parameter_list) @pick.3
     body: (block) @pick.4))) @site
 (#set! form "arg"))
