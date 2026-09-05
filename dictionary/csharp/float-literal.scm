; 실수형이 셋인 자리. 짚는 것은 값이 아니라 **어느 실수형인가**다 — 2진 둘과 10진 하나다.
((local_declaration_statement
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#any-of? @pick.1 "double" "float" "decimal")
 (#set! form "floatdecl"))

((field_declaration
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator name: (identifier) @pick.2))) @site
 (#any-of? @pick.1 "double" "float" "decimal")
 (#set! form "floatfield"))

((property_declaration
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "double" "float" "decimal")
 (#set! form "floatprop"))

((parameter
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "double" "float" "decimal")
 (#set! form "floatparam"))
