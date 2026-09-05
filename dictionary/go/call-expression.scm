; 함수 부르기. 인자는 언제나 **값 복사**다.
; 이름으로 부르는 것과 점 찍어 부르는 것을 갈라 잡는다 — 뒤의 것이 압도적으로 많다.
((call_expression
   function: (identifier) @pick.2
   arguments: (argument_list . (_) @pick.3)) @site
 (#set! form "plain"))

((call_expression
   function: (selector_expression
     operand: (identifier) @pick.4
     field: (field_identifier) @pick.2)
   arguments: (argument_list . (_) @pick.3)) @site
 (#set! form "method"))
