; 셈하기. `/` 가 든다 — 정수끼리 나누면 0 쪽으로 자른다(`7 / 2` 는 3, `-7 / 2` 는 -3).
; 타입이 다르면 못 더한다는 것(E0308)이 이 개념의 둘째 줄이다. 견주기는 `rs/comparison` 이 가져간다.
; 빈칸은 안 낸다 — 기호가 한 글자라 생성기가 뺀다(`MIN_HOLE`). yaml 의 `no_hole_reason` 을 보라.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "/" "%"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "arith"))

; `total += n` — 셈과 넣기가 한 기호다. `mut` 이어야 하는 자리.
((compound_assignment_expr
   left: (_) @pick.2
   operator: ["+=" "-=" "*=" "/=" "%="] @pick.1
   right: (_) @pick.3) @site
 (#set! form "compound"))
