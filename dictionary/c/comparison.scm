; 견주기. 결과가 참·거짓이 아니라 `int` 0 또는 1 이다 — `int ok = (a == b);` 가 성립한다.
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
