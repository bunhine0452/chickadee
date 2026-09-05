; 한 번에 꺼내 이름 붙이기. 기본이 **복사**다 — 훑으면서 고치려면 참조를 붙여야 한다
; (`cpp.md` §4 #30).
((declaration
   type: (placeholder_type_specifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (structured_binding_declarator) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "bind"))

((for_range_loop
   type: (placeholder_type_specifier) @pick.1 @hole
   declarator: (structured_binding_declarator) @pick.2
   right: (_) @pick.3) @site
 (#set! form "bind-loop"))
