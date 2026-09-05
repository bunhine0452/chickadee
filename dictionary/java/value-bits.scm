; 정수 타입으로 이름 만들기. 요점은 값이 아니라 **자리 수**다 — 타입이 칸 수를 못 박는다.
; 글자(`char`)는 여기 안 든다. 그 자리는 `java/text-length` 가 진다.
((local_variable_declaration
   type: (integral_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1 "int" "long" "short" "byte")
 (#set! form "intdecl"))

((field_declaration
   type: (integral_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2)) @site
 (#any-of? @pick.1 "int" "long" "short" "byte")
 (#set! form "intfield"))

((formal_parameter
   type: (integral_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "int" "long" "short" "byte")
 (#set! form "intparam"))
