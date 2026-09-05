; 견주기 — 값 둘이 들어가고 참·거짓 하나가 나온다. 연산자가 정답이라 그것을 구멍으로 판다.
; 셈(`+ - * / %`)과 같은 `binary_expression` 이라 연산자 목록으로 갈라 놓는다.
((binary_expression
   left: (_) @pick.2
   operator: ["===" "!==" "==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
