; 배열 — 크기가 만들 때 정해지고 그 뒤로 안 바뀌는 상자. 세 자리가 한 개념이다:
; 타입에 붙는 `[]` · `new` 로 자리를 잡는 곳 · 번호로 꺼내는 곳.
;
; `[]` 는 `dimensions` 노드 하나라 여러 겹(`int[][]`)도 한 번에 잡힌다.
((array_type
   element: (_) @pick.2
   dimensions: (dimensions) @pick.1 @hole) @site
 (#set! form "type"))

((array_creation_expression
   "new" @pick.1
   type: (_) @pick.2
   dimensions: (_) @pick.3) @site
 (#set! form "create"))

((array_access
   array: (_) @pick.4
   index: (_) @pick.5) @site
 (#set! form "index"))
