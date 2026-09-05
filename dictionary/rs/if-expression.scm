; 조건으로 흐름 나누기. 구멍은 `if` 고, 오답 `while`·`match`·`loop` 가 전부 같은 자리에 설 수
; 있는 낱말이다. 조건에 괄호가 없고 중괄호는 못 뺀다 — 그리고 `if` 가 **값을 낸다**
; (`let x = if c { 1 } else { 2 };`). `if let` 도 같은 노드(`condition` 이 `let_condition`)라 함께 잡힌다.
((if_expression
   "if" @pick.1 @hole
   condition: (_) @pick.2
   consequence: (block) @pick.3
   alternative: (else_clause)? @pick.4) @site
 (#set! form "if"))
