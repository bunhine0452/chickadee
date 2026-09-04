; if 문 — 조건이 참일 때만 아래 묶음을 실행한다. `else` 는 선택이라 `?` 로 둔다.
; 키워드 자체가 정답이라 `const-declaration.scm` 과 같은 방식으로 익명 노드를 잡는다.
((if_statement
   "if" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   consequence: (_) @pick.3
   alternative: (else_clause)? @pick.4) @site
 (#set! form "if"))
