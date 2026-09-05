; 조건으로 값 고르기. 한 줄에 접힌 갈림이고, **양쪽 갈래의 타입이 맞아야** 컴파일된다.
;
; 빈칸은 안 낸다 — 구멍이 물음표 한 글자라 생성에서 떨어진다(`MIN_HOLE`).
((conditional_expression
   condition: (_) @pick.1
   consequence: (_) @pick.2
   alternative: (_) @pick.3) @site
 (#set! form "ternary"))
