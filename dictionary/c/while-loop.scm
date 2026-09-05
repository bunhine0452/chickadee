; 조건이 참인 동안 되풀이. 조건 자리는 「참이냐」가 아니라 「0 이 아니냐」다 — `while (n--)` 이 도는
; 이유이고 `while (1)` 이 관용구인 이유다. `do … while` 은 몸통을 먼저 돌린다 — 구멍은 안 낸다.
((while_statement
   "while" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   body: (_) @pick.3) @site
 (#set! form "while"))

((do_statement
   "do" @pick.1
   body: (_) @pick.3
   condition: (parenthesized_expression) @pick.2) @site
 (#set! form "do"))
