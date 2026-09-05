; 어느 것이 먼저 묶이나. Rust 에서 눈에 띄는 자리 다섯 — `as` 가 이항 연산자보다 세다 ·
; 곱셈이 덧셈보다 세다 · 단락 평가 · `..` 가 가장 약하다 · `&v[0]` 은 `&(v[0])` 이다.
((binary_expression
   left: (type_cast_expression) @pick.2
   operator: _ @pick.1
   right: (_) @pick.3) @site
 (#set! form "cast-first"))

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

((range_expression
   (_) @pick.2
   [".." "..="] @pick.1
   (binary_expression) @pick.3) @site
 (#set! form "range-last"))

((reference_expression
   "&" @pick.1
   value: (index_expression (_) @pick.2 (_) @pick.3)) @site
 (#set! form "ref-index"))
