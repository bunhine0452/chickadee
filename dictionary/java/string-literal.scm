; 글자 묶음. 자바에서 묶음을 여는 것은 **큰따옴표뿐**이고 작은따옴표는 글자 한 개다.
((local_variable_declaration
   type: (type_identifier) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (string_literal) @pick.3)) @site
 (#eq? @pick.1 "String")
 (#set! form "strdecl"))

((field_declaration
   type: (type_identifier) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (string_literal) @pick.3)) @site
 (#eq? @pick.1 "String")
 (#set! form "strfield"))

((method_invocation
   name: (identifier) @pick.1
   arguments: (argument_list (string_literal) @pick.3)) @site
 (#set! form "strarg"))
