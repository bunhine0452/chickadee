; 조건으로 흐름 나누기. 구멍은 낱말이고, 요점은 **중괄호를 빼면 다음 한 문장만 붙는다**는
; 것이다 — 들여쓰기는 아무 뜻이 없다.
((if_statement
   "if" @pick.1 @hole
   condition: (condition_clause value: (_) @pick.2)
   consequence: (_) @pick.3) @site
 (#set! form "if"))
