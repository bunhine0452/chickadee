; 사람이 안 적어도 일어나는 넓히기. 좁은 값이 넓은 자리에 그냥 들어가는 곳과,
; 셈에서 한쪽이 끌어올려지는 곳.
((local_variable_declaration
   type: (floating_point_type) @pick.1
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (decimal_integer_literal) @pick.3)) @site
 (#set! form "widen"))

((binary_expression
   left: (decimal_integer_literal) @pick.2
   operator: _ @pick.1
   right: (decimal_floating_point_literal) @pick.3) @site
 (#set! form "promote"))
