; 이름 뒤에 붙는 타입. `javascript` 문법에는 `type_annotation` 노드가 아예 없다
; (kinds 224 대 316) — `grammars` 가 [typescript, tsx] 뿐인 이유가 그것이다.
((variable_declarator
   name: (_) @pick.1
   type: (type_annotation ":" @pick.3 (_) @pick.2)) @site
 (#set! form "declarator"))

((required_parameter
   pattern: (_) @pick.1
   type: (type_annotation ":" @pick.3 (_) @pick.2)) @site
 (#set! form "parameter"))

((function_declaration
   name: (_) @pick.1
   return_type: (type_annotation ":" @pick.3 (_) @pick.2)) @site
 (#set! form "return"))
