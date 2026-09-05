; 조건으로 흐름 나누기. 구멍은 `if` 고, 오답 `while`·`for`·`switch` 가 전부 같은 자리에
; 설 수 있는 낱말이라 종류가 안 섞인다.
;
; 조건이 `parenthesized_expression` 이라 **괄호가 문법에 박혀 있다** — 파이썬처럼 뺄 수 없다.
((if_statement
   "if" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   consequence: (_) @pick.3
   alternative: (_)? @pick.4) @site
 (#set! form "if"))
