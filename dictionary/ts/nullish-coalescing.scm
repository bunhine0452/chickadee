; `a ?? b` — 「없음」을 undefined · null 둘로만 보는 자리다.
; @hole 과 @pick.2 는 같은 노드다: 지목형은 기호를 짚고, 빈칸형은 그 기호를 지운다.
((binary_expression
   left: (_) @pick.1
   operator: "??" @pick.2 @hole
   right: (_) @pick.3) @site
 (#set! form "binary"))
