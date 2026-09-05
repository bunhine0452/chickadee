; 식이 접히는 순서. 두 자리에서 눈에 띈다 — 세기가 다른 연산자가 섞인 식과, 단락 평가.
((binary_expression
   left: (_) @pick.2
   operator: ["&&" "||"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "shortcircuit"))

((binary_expression
   left: (_) @pick.2
   operator: ["+" "-"] @pick.1
   right: (binary_expression operator: ["*" "/" "%"]) @pick.3) @site
 (#set! form "mixed"))
