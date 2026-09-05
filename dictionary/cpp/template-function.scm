; 타입 자리 비워 두기. 부르는 곳마다 함수가 **새로 만들어진다** — 그래서 몸통이 헤더에
; 있어야 하고 오류가 쓴 줄이 아니라 만들어진 자리에서 난다 (`cpp.md` §4 #25).
((template_declaration
   "template" @pick.1 @hole
   parameters: (template_parameter_list) @pick.2
   (function_definition
     declarator: (function_declarator declarator: (identifier) @pick.3))) @site
 (#set! form "tmplfn"))

((template_declaration
   "template" @pick.1 @hole
   parameters: (template_parameter_list) @pick.2
   (class_specifier name: (type_identifier) @pick.3)) @site
 (#set! form "tmplclass"))

((template_declaration
   "template" @pick.1 @hole
   parameters: (template_parameter_list) @pick.2
   (struct_specifier name: (type_identifier) @pick.3)) @site
 (#set! form "tmplstruct"))
