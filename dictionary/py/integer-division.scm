; 파이썬에는 나누기가 **둘**이다. `/` 는 딱 떨어져도 소수를 내고(`py/arithmetic` 의 자리),
; `//` 는 **아래로** 버린다 — 0 쪽이 아니라 아래라서 `-7 // 2` 가 `-3` 이 아니라 `-4` 다.
;
; `py/arithmetic` 이 `//` 를 일부러 뺀 자리가 여기다 (`arithmetic.scm` 첫 주석).
; 그쪽의 규칙(「나누기는 늘 소수를 낸다」)이 `//` 에서 거짓이 되므로 개념을 갈랐다.

; 몫 나누기.
((binary_operator
   left: (_) @pick.2
   operator: "//" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "floordiv"))

; `n //= k` — 같은 버림이 제자리에서 일어난다.
((augmented_assignment
   left: (_) @pick.2
   operator: "//=" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "floordiv-assign"))

; `divmod(a, b)` — 몫과 나머지를 한 번에. `i == (i//j)*j + (i%j)` 가 여기서 눈에 보인다.
((call
   function: (identifier) @pick.1
   arguments: (argument_list "(" @pick.2 . (_) @pick.3)) @site
 (#eq? @pick.1 "divmod")
 (#set! form "divmod"))
