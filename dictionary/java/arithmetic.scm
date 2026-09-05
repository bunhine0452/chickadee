; 셈하기. `/` 가 **든다** — 0부 축 E 에서 이 개념이 정수 나누기를 겸한다
; (`docs/curriculum/java.md` §1.5.6 의 `integer-division` 조각). 소수를 버리는 것이
; 이 개념의 규칙 둘째 줄이고, 그 자리를 다른 개념으로 미루면 「7 / 2 가 왜 3 인가」가
; 코스 어디에도 안 선다. 비교 연산자는 `java/comparison` 이 가져간다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "/" "%"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "arith"))
