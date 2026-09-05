; 소수가 2진수로 안 떨어지는 것이 보이는 자리 — 실수 리터럴이 낀 셈과, 실수 리터럴 선언.
((binary_expression
   left: (decimal_floating_point_literal) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "floatop"))

((local_variable_declaration
   type: (floating_point_type)
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (decimal_floating_point_literal) @pick.3)) @site
 (#set! form "floatlit"))
