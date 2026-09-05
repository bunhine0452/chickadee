; 모양으로 갈래 고르기. 같은 낱말이 문일 수도 식일 수도 있는데, **식 쪽은 모든 갈래가 값을
; 내야** 하고 이름이 governing 식 **뒤에** 온다 — 그 어순이 문과 식을 가르는 표시다.
((switch_expression
   . (_) @pick.2
   "switch" @pick.1 @hole
   (switch_expression_arm) @pick.3) @site
 (#set! form "switch-expr"))
