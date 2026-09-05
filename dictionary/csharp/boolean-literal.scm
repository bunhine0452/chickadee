; 참·거짓 값. C# 은 조건 자리에 이 타입만 받는다 — 「참 같은 값」이 없다.
((local_declaration_statement
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#eq? @pick.1 "bool")
 (#set! form "booldecl"))

((field_declaration
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator name: (identifier) @pick.2))) @site
 (#eq? @pick.1 "bool")
 (#set! form "boolfield"))

((property_declaration
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#eq? @pick.1 "bool")
 (#set! form "boolprop"))

((parameter
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#eq? @pick.1 "bool")
 (#set! form "boolparam"))
