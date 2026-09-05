; 못 고치게 표시하기. `*` 어느 쪽에 적느냐로 잠기는 대상이 바뀐다 — `const char *s` 는 글자를,
; `char * const s` 는 이름을 잠근다. 앞엣것은 `declaration` 의 직접 자식이고 뒤엣것은
; `pointer_declarator` 안에 든다 — 그 차이로 갈라 낸다.
((declaration
   (type_qualifier) @pick.1 @hole
   type: (_) @pick.2
   declarator: (_) @pick.3) @site
 (#eq? @pick.1 "const")
 (#set! form "const-value"))

((parameter_declaration
   (type_qualifier) @pick.1 @hole
   type: (_) @pick.2
   declarator: (_) @pick.3) @site
 (#eq? @pick.1 "const")
 (#set! form "const-param"))

((declaration
   type: (_) @pick.2
   declarator: (init_declarator
     declarator: (pointer_declarator
       (type_qualifier) @pick.1 @hole
       declarator: (identifier) @pick.3))) @site
 (#eq? @pick.1 "const")
 (#set! form "const-pointer"))
