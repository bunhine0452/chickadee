; 타입이 다르면 조용히 맞춘다. 크기를 묻는 자리만 잡는다 — 같은지만 묻는 자리에서는
; 변환이 답을 안 바꾸는 일이 많은데, 크고 작음은 **어느 타입으로 견주느냐**가 순서를 뒤집는다.
((binary_expression
   left: (_) @pick.2
   operator: ["<" ">" "<=" ">="] @pick.1
   right: (_) @pick.3) @site
 (#set! form "size-compare"))
