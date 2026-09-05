; 없는 자리인지 보기. `NULL` 은 낱말이 아니라 헤더가 주는 매크로이고 「없음」이 아니라 0번지라
; `if (p)` 로도 같은 검사가 된다 — 그쪽은 `c/truthiness` 의 것이다. 문법이 `NULL` 을 `(null)` 노드로
; 지어낸다(c.md §8 ⑦). 자리 셋 — 견주기 · 되돌리기(`free` 뒤) · 초기화.
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!="] @pick.1
   right: (null) @pick.3 @hole) @site
 (#set! form "compare"))

((binary_expression
   left: (null) @pick.3 @hole
   operator: ["==" "!="] @pick.1
   right: (_) @pick.2) @site
 (#set! form "compare"))

((assignment_expression
   left: (_) @pick.2
   operator: "=" @pick.1
   right: (null) @pick.3 @hole) @site
 (#set! form "reset"))

((init_declarator
   declarator: (pointer_declarator declarator: (identifier) @pick.2)
   value: (null) @pick.3 @hole) @site
 (#set! form "init"))
