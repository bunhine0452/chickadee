; 견주기가 내는 답이 셋. 조건 둘을 잇는 낱말이 그 셋을 어떻게 접는지가 이 개념이다.
; `OR` 이 아니라 `AND` 만 잡는다 — 보기 넷을 고정하려면 구멍의 원문이 하나여야 한다.
((where
   (binary_expression
     left: (binary_expression) @pick.2
     operator: (keyword_and) @pick.1 @hole
     right: (binary_expression) @pick.3)) @site
 (#set! form "connective"))
