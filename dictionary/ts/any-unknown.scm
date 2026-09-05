; 둘 다 「모른다」인데 하나는 검사를 끄고 하나는 가리기를 강제한다.
; 같은 노드(`predefined_type`)라 이름으로 갈라 잡는다.
((variable_declarator
   name: (_) @pick.2
   type: (type_annotation (predefined_type) @pick.1)) @site
 (#any-of? @pick.1 "any" "unknown")
 (#set! form "declarator"))

((required_parameter
   pattern: (_) @pick.2
   type: (type_annotation (predefined_type) @pick.1)) @site
 (#any-of? @pick.1 "any" "unknown")
 (#set! form "parameter"))

((function_declaration
   name: (_) @pick.3
   return_type: (type_annotation (predefined_type) @pick.1)) @site
 (#any-of? @pick.1 "any" "unknown")
 (#set! form "return"))
