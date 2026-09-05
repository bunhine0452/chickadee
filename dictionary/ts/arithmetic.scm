; 셈 — 값 둘로 새 값 하나를 만든다. 견주기와 같은 노드라 연산자 목록으로 갈라 놓는다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "/" "%"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "arith"))
