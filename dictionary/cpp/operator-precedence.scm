; 괄호를 안 쓰면 무엇이 먼저 묶이나. 세 자리에서 눈에 띈다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-"] @pick.1
   right: (binary_expression operator: ["*" "/" "%"]) @pick.3) @site
 (#set! form "mixed"))

; C++ 고유 — 흘려보내기가 비트 연산보다 세다. `std::cout << a & b` 는
; `(std::cout << a) & b` 다 (`cpp.md` §0.1 #10).
((binary_expression
   left: (binary_expression operator: "<<") @pick.2
   operator: ["&" "|" "^"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "stream-and"))

; 단락 평가 — `&&` 가 `||` 보다 세다.
; `&&` 가 `||` 보다 먼저 묶인다 — 둘이 섞인 식만 우선순위 문항이다. 안쪽의 `a && b` 를 따로 잡으면
; 같은 줄이 두 자리가 된다(2026-09-06 골든).
((binary_expression
   left: (binary_expression operator: "&&") @pick.2
   operator: "||" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "shortcircuit"))
