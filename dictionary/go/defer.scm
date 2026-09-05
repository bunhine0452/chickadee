; 인자는 지금 계산된다. 호출만 함수 끝으로 미뤄진다.
; 세 형태를 잡는다 — 점 찍어 부르는 것 · 이름으로 부르는 것 · 이름 없는 함수를 그 자리에서
; 만들어 미루는 것. 마지막 형태에서만 「인자가 없으니 캡처다」가 보인다.
((defer_statement
   "defer" @pick.1 @hole
   (call_expression
     function: (selector_expression
       operand: (_) @pick.4
       field: (field_identifier) @pick.2)
     arguments: (argument_list) @pick.3)) @site
 (#set! form "method"))

((defer_statement
   "defer" @pick.1 @hole
   (call_expression
     function: (identifier) @pick.2
     arguments: (argument_list) @pick.3)) @site
 (#set! form "plain"))

((defer_statement
   "defer" @pick.1 @hole
   (call_expression
     function: (func_literal parameters: (parameter_list) @pick.2 body: (block) @pick.3)
     arguments: (argument_list))) @site
 (#set! form "literal"))
