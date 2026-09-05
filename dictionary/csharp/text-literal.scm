; 따옴표 하나가 타입을 가르는 자리. 큰따옴표는 글자 묶음(참조형), 작은따옴표는 글자
; 하나(값형)다. 짚는 것은 그 둘을 가르는 **타입 이름**이다.
((local_declaration_statement
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#any-of? @pick.1 "string" "char")
 (#set! form "textdecl"))

((field_declaration
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator name: (identifier) @pick.2))) @site
 (#any-of? @pick.1 "string" "char")
 (#set! form "textfield"))

((property_declaration
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "string" "char")
 (#set! form "textprop"))

((parameter
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "string" "char")
 (#set! form "textparam"))
