; 값은 켜짐·꺼짐의 묶음이다. 그 묶음을 **직접** 만지는 자리는 비트 연산자뿐이고,
; JS 에서는 그때만 64비트 수가 32비트로 내려앉는다 — `1 << 31` 이 음수가 되는 이유다.
((binary_expression
   left: (_) @pick.2
   operator: ["&" "|" "^" "<<" ">>" ">>>"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "bitop"))

; `~n` — 모든 비트를 뒤집는다. 한 항짜리라 오른쪽이 없다.
((unary_expression
   operator: "~" @pick.1
   argument: (_) @pick.2) @site
 (#set! form "flip"))

; `0b1010` · `0x2A` · `0o755` — 비트를 그대로 적은 리터럴. 값은 십진과 같은 종류다.
((number) @site @pick.1
 (#match? @pick.1 "^0[bBxXoO]")
 (#set! form "radix"))
