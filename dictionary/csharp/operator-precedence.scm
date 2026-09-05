; 식이 접히는 순서. 두 자리에서 눈에 띈다 — 단락 평가와, 세기가 다른 연산자가 섞인 식.
; C# 은 `<<` 가 `+` 보다 **아래**라 `1 << 2 + 3` 이 32 다(Go·Swift 는 7). 그 자리도 아래에 든다.
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

((binary_expression
   left: (_) @pick.2
   operator: ["<<" ">>"] @pick.1
   right: (binary_expression operator: ["+" "-"]) @pick.3) @site
 (#set! form "shift"))
