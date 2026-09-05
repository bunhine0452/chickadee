; 셈하기. 견주기(`=` `<`)와 같은 노드라 연산자 목록으로만 갈린다.
; `*` 는 여기서 곱하기다 — `SELECT *` 와 `COUNT(*)` 의 별은 `all_fields` 라 안 걸린다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "/" "%"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "arith"))
