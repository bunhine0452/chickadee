; 글자 하나 값. `'a'` 는 글자가 아니라 정수 97 이고, C 에서는 타입이 `int` 라 `sizeof('a')` 가 4 다
; (C++ 은 1 — c.md §0.2). 보이는 자리 넷 — 셈 안 · 선언의 값 · 넣기의 값 · sizeof 안.
((binary_expression
   left: (_) @pick.2
   operator: ["-" "+" "==" "!=" "<" ">" "<=" ">="] @pick.3
   right: (char_literal) @pick.1 @hole) @site
 (#set! form "charop"))

((init_declarator
   declarator: (identifier) @pick.2
   value: (char_literal) @pick.1 @hole) @site
 (#set! form "charinit"))

((assignment_expression
   left: (_) @pick.2
   operator: "=" @pick.3
   right: (char_literal) @pick.1 @hole) @site
 (#set! form "charset"))

((sizeof_expression
   "sizeof" @pick.3
   value: (parenthesized_expression (char_literal) @pick.1 @hole)) @site
 (#set! form "charsize"))
