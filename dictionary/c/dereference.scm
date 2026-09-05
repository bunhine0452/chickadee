; 자리를 열어 값 꺼내기. 같은 `*` 가 선언에서는 「포인터다」, 식에서는 「열어라」다 — 노드가 아예
; 다르다(`pointer_declarator` 대 `pointer_expression`, c.md §8 ⑤). 맥락 넷으로 짚는다 —
; 쓰기 · 초기화에서 읽기 · 돌려주며 읽기 · 셈·조건에서 읽기.
((assignment_expression
   left: (pointer_expression operator: "*" @pick.1 @hole argument: (_) @pick.2)
   operator: "="
   right: (_) @pick.3) @site
 (#set! form "store"))

((init_declarator
   declarator: (identifier) @pick.3
   value: (pointer_expression operator: "*" @pick.1 @hole argument: (_) @pick.2)) @site
 (#set! form "load"))

((return_statement
   (pointer_expression operator: "*" @pick.1 @hole argument: (_) @pick.2)) @site
 (#set! form "load-return"))

((binary_expression
   left: (pointer_expression operator: "*" @pick.1 @hole argument: (_) @pick.2)
   right: (_) @pick.3) @site
 (#set! form "load-op"))

((parenthesized_expression
   (pointer_expression operator: "*" @pick.1 @hole argument: (_) @pick.2)) @site
 (#set! form "load-test"))
