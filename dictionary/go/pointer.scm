; 값 있는 자리 가리키기. 주소 만들기(`&`) · 따라가기(`*x`) · 타입으로 적힌 것(`*T`) 셋이다.
((unary_expression
   operator: "&" @pick.1 @hole
   operand: (_) @pick.2) @site
 (#set! form "addr"))

((parameter_declaration
   name: (identifier) @pick.2
   type: (pointer_type "*" @pick.1 @hole (type_identifier) @pick.3)) @site
 (#set! form "param"))

((field_declaration
   name: (field_identifier) @pick.2
   type: (pointer_type "*" @pick.1 @hole (_) @pick.3)) @site
 (#set! form "field"))
