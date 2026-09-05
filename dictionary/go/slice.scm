; 순서 있는 목록이 아니라 **뒷배열을 보는 창**이다.
; 창이 실제로 보이는 자리는 `xs[1:3]` 이고, 그 창이 생기는 자리는 선언과 리터럴이다.
((slice_expression
   operand: (identifier) @pick.2
   start: (_) @pick.3
   end: (_) @pick.4) @site
 (#set! form "reslice"))

((var_spec
   name: (identifier) @pick.2
   type: (slice_type) @pick.1 @hole) @site
 (#set! form "decl"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (composite_literal
     type: (slice_type) @pick.1 @hole
     body: (literal_value) @pick.3) .)) @site
 (#set! form "lit"))
