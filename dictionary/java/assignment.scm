; 이름에 값 다시 넣기. 구멍은 `=` 고, 오답은 전부 같은 자리에 설 수 있는 기호다.
; 선언(`int x = 1`)은 `local_variable_declaration` 이라 여기 안 걸린다 — 다시 넣는 줄만 잡는다.
((assignment_expression
   left: (identifier) @pick.2
   operator: "=" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "assign"))
