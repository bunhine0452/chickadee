; 사람이 적어야 하는 좁히기. 괄호 안의 타입이 구멍이고, 잘리는 것은 반올림이 아니라 버림이다.
; 참조 다운캐스트는 여기 안 든다 — 값이 안 잘리므로 다른 기계다.
((cast_expression
   "(" @pick.2
   type: (integral_type) @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "narrow"))

((cast_expression
   "(" @pick.2
   type: (floating_point_type) @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "narrow-float"))
