; 값째로 넘기기. **노드가 없다** — `let b = a;` 의 트리는 `a` 가 `String` 이든 `i32` 든 똑같다.
; 이동인지 복사인지는 `a` 의 타입이 정하고 tree-sitter 는 타입을 모른다 (rs.md §5).
;
; 그래도 그 줄이 「이동인지 복사인지가 타입으로 정해지는 자리」이고, 카드는 그 물음을 그대로
; 낸다 — 정답을 사용처에서 뽑지 않고 규칙(`Copy` 면 복사, 아니면 이동)으로 낸다. `Copy` 타입
; 자리는 오탐이 아니라 「복사인 쪽」의 예다. 정밀도 실측은 rs.md §12.
; 빈칸은 안 낸다 — 이동에는 낱말이 없다. yaml 의 `no_hole_reason`.
((let_declaration
   "let" @pick.3
   . pattern: (identifier) @pick.2
   value: (identifier) @pick.1) @site
 (#set! form "rebind"))

; `f(s)` — 이름 하나를 그대로 넘긴다. `&` 가 **없는** 인자가 값을 넘긴 것이다.
((call_expression
   function: (identifier) @pick.2
   arguments: (arguments "(" @pick.3 . (identifier) @pick.1 .)) @site
 (#set! form "pass-by-value"))
