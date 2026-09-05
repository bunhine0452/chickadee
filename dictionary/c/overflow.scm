; 자리가 모자라면. 넘침은 실행에서 일어나 정적으로는 안 보인다 — 보이는 자리는 둘뿐이다.
; ① 한계값 이름이 셈에 낀 식 (`INT_MAX + 1`) ② 칸을 손으로 자르는 마스크 (`x & 0xFF`).
; 나머지는 합성이 정본이다 (c.md §0.3).
((binary_expression
   left: (identifier) @pick.2
   operator: ["+" "-" "*"] @pick.1
   right: (_) @pick.3) @site
 (#match? @pick.2 "^U?(INT|LONG|SHORT|CHAR|LLONG)(8|16|32|64)?_(MAX|MIN)$")
 (#set! form "limit"))

((binary_expression
   left: [(identifier) (number_literal) (call_expression) (subscript_expression) (field_expression)] @pick.2
   operator: ["+" "-" "*"] @pick.1
   right: (identifier) @pick.3) @site
 (#match? @pick.3 "^U?(INT|LONG|SHORT|CHAR|LLONG)(8|16|32|64)?_(MAX|MIN)$")
 (#set! form "limit"))

; 부호 없는 감싸기를 손으로 적은 자리 — 8·16·32칸으로 자른다.
((binary_expression
   left: (_) @pick.2
   operator: "&" @pick.1
   right: (number_literal) @pick.3) @site
 (#match? @pick.3 "^(0[xX]([fF]{2}|[fF]{4}|[fF]{8})[uUlL]*|255|65535|4294967295)$")
 (#set! form "mask"))
