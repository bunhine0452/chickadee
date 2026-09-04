; 셈하기. `/` 를 **뺀다** — 정수 나누기가 소수를 버리는 것은 이 개념의 근거가 아니라
; 다른 개념(`java/integer-division`, 아직 없음)의 것이고, 여기 넣으면 규칙이 사용처마다 갈린다.
; 비교 연산자는 `java/comparison` 이 가져간다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "%"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "arith"))
