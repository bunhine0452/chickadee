; 자리가 정해져 있다는 사실이 코드에 드러나는 두 자리 — 한계값을 이름으로 부르는 곳과,
; 32칸으로 모자라 64칸을 고른 곳.
((field_access
   object: (identifier) @pick.2
   field: (identifier) @pick.1) @site
 (#any-of? @pick.1 "MAX_VALUE" "MIN_VALUE")
 (#set! form "limit"))

((local_variable_declaration
   type: (integral_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#eq? @pick.1 "long")
 (#set! form "wider"))

((field_declaration
   type: (integral_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2)) @site
 (#eq? @pick.1 "long")
 (#set! form "wider-field"))

((formal_parameter
   type: (integral_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#eq? @pick.1 "long")
 (#set! form "wider-param"))
