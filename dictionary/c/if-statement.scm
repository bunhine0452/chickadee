; 조건으로 갈라 실행하기. 구멍은 `if` 고, 오답 `while`·`for`·`switch` 가 전부 같은 자리에 설 수 있는
; 낱말이라 종류가 안 섞인다. 중괄호 없는 갈래를 따로 낸다 — **다음 한 문장만** 딸린다는 것이
; C 에서 눈에 보이는 묶음과 실제 묶음이 갈라지는 자리다 (c.md §2 #5).
((if_statement
   "if" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   consequence: (compound_statement) @pick.3
   alternative: (else_clause)? @pick.4) @site
 (#set! form "if-block"))

((if_statement
   "if" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   consequence: [(expression_statement) (return_statement) (break_statement) (continue_statement)
                 (if_statement) (for_statement) (while_statement) (goto_statement)] @pick.3
   alternative: (else_clause)? @pick.4) @site
 (#set! form "if-bare"))
