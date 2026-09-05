; 소유를 타입에 적기. 언어가 「누가 놓는가」를 말해 주는 몇 안 되는 자리다 (`cpp.md` §3 #19).
((declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#any-of? @pick.1 "unique_ptr" "shared_ptr" "weak_ptr")
 (#set! form "smartdecl"))

((field_declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#any-of? @pick.1 "unique_ptr" "shared_ptr" "weak_ptr")
 (#set! form "smartfield"))

; 만드는 자리 — 자리 잡기와 소유 표시가 한 줄에 묶인다.
((call_expression
   function: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_function
       name: (identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   arguments: (argument_list)) @site
 (#any-of? @pick.1 "make_unique" "make_shared")
 (#set! form "make"))
