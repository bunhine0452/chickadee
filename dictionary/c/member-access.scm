; 안의 이름 꺼내기. 점이냐 화살이냐가 왼쪽이 값이냐 자리냐로만 정해진다 — `p->x` 는 `(*p).x` 의
; 줄임이다. 둘은 **같은 노드**(`field_expression`)라 `operator:` 로만 갈린다 (c.md §8 ⑤).
((field_expression
   argument: (_) @pick.2
   operator: "." @pick.1 @hole
   field: (field_identifier) @pick.3) @site
 (#set! form "dot"))

((field_expression
   argument: (_) @pick.2
   operator: "->" @pick.1 @hole
   field: (field_identifier) @pick.3) @site
 (#set! form "arrow"))
