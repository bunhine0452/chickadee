; 어느 것이 먼저 묶이나. 자리 넷 — `*p++`(`++` 가 `*` 보다 세다) · `a & b == c`(견주기가 `&` 보다
; 세다) · 세기가 다른 셈이 섞인 식 · 단락 평가.
((pointer_expression
   operator: "*" @pick.1
   argument: (update_expression
     argument: (_) @pick.2
     operator: ["++" "--"] @pick.3)) @site
 (#set! form "deref-step"))

((binary_expression
   left: (_) @pick.2
   operator: ["&" "|"] @pick.1
   right: (binary_expression operator: ["==" "!=" "<" ">" "<=" ">="]) @pick.3) @site
 (#set! form "bit-compare"))

((binary_expression
   left: (_) @pick.2
   operator: ["+" "-"] @pick.1
   right: (binary_expression operator: ["*" "/" "%"]) @pick.3) @site
 (#set! form "mixed"))

((binary_expression
   left: (_) @pick.2
   operator: ["&&" "||"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "shortcircuit"))
