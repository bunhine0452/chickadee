; 이름에 값 다시 넣기. 조건 안의 `=` 도 같은 노드다 — C 는 그것을 막지 않는다 (c.md §9 #7).
; `int x = 0;` 은 `init_declarator` 라 여기 안 든다 — 그 줄은 `c/declaration` 의 것이다.
((assignment_expression
   left: (identifier) @pick.2
   operator: "=" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "assign"))
