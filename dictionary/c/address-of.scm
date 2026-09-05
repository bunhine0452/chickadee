; 값의 자리 얻기. `&x` 는 `*p` 와 **같은 노드**(`pointer_expression`)라 `operator:` 로만 갈린다
; (c.md §8 ⑤). 맥락 셋으로 짚는다 — 포인터 초기화 · 인자(`scanf("%d", &n)`) · 넣기.
((init_declarator
   declarator: (pointer_declarator declarator: (identifier) @pick.3)
   value: (pointer_expression operator: "&" @pick.1 @hole argument: (_) @pick.2)) @site
 (#set! form "addr-init"))

((call_expression
   function: (identifier) @pick.3
   arguments: (argument_list
     (pointer_expression operator: "&" @pick.1 @hole argument: (_) @pick.2))) @site
 (#set! form "addr-arg"))

((assignment_expression
   left: (_) @pick.3
   operator: "="
   right: (pointer_expression operator: "&" @pick.1 @hole argument: (_) @pick.2)) @site
 (#set! form "addr-assign"))
