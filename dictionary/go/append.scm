; 목록 뒤에 붙이기. **반환값을 다시 담는 줄**과 그냥 부르는 줄을 갈라 잡는다 —
; 뒤의 것이 「아무 일도 안 난다」가 실제로 보이는 자리다.
((assignment_statement
   left: (expression_list . (identifier) @pick.2 .)
   operator: "=" @pick.4
   right: (expression_list . (call_expression
     function: (identifier) @pick.1 @hole
     arguments: (argument_list . (_) @pick.3)) .)) @site
 (#eq? @pick.1 "append")
 (#set! form "reassign"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (call_expression
     function: (identifier) @pick.1 @hole
     arguments: (argument_list . (_) @pick.3)) .)) @site
 (#eq? @pick.1 "append")
 (#set! form "bind"))
