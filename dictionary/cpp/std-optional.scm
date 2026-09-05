; 없을 수도 있는 값. 「없음」이 언어에 **뒤늦게** 왔고, 그전에 그 일을 하던 것 셋이
; 코드에 그대로 남아 있다 (`cpp.md` §4 #31).
((declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#eq? @pick.1 "optional")
 (#set! form "optdecl"))

((function_definition
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (function_declarator declarator: (_))) @site
 (#eq? @pick.1 "optional")
 (#set! form "optreturn"))

((parameter_declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#eq? @pick.1 "optional")
 (#set! form "optparam"))
