; 조건으로 흐름 나누기. 구멍은 `if` 고, 오답 `while`·`for`·`switch` 가 전부 같은 자리에
; 설 수 있는 낱말이라 종류가 안 섞인다.
;
; 자바와 달리 조건이 `parenthesized_expression` 으로 안 싸인다 — 괄호가 익명 토큰이라
; `condition:` 이 곧 식이다.
((if_statement
   "if" @pick.1 @hole
   condition: (_) @pick.2
   consequence: (_) @pick.3
   alternative: (_)? @pick.4) @site
 (#set! form "if"))
