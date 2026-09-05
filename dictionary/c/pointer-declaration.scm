; 자리를 담는 이름. `*` 가 타입 쪽이 아니라 **이름 쪽**에 붙는다 — `int *p, q;` 에서 `q` 는 포인터가
; 아니다 (c.md §9 #1). 선언의 `*` 는 `pointer_declarator` 이고 식의 `*` 는 `pointer_expression` 이라
; 노드가 다르다(§8 ⑤). 두 겹 포인터(`char **argv`)는 안 잡는다 — 안쪽 선언자가 이름이 아니다.
((declaration
   type: (_) @pick.1
   declarator: (pointer_declarator
     "*" @pick.3 @hole
     declarator: (identifier) @pick.2)) @site
 (#set! form "ptr"))

((declaration
   type: (_) @pick.1
   declarator: (init_declarator
     declarator: (pointer_declarator
       "*" @pick.3 @hole
       declarator: (identifier) @pick.2)
     value: (_))) @site
 (#set! form "ptr-init"))

((parameter_declaration
   type: (_) @pick.1
   declarator: (pointer_declarator
     "*" @pick.3 @hole
     declarator: (identifier) @pick.2)) @site
 (#set! form "ptr-param"))
