; 점 하나가 「안의 것을 꺼낸다」다. 없는 이름이면 `AttributeError` 로 **그 자리에서 멈춘다** —
; 조용히 `undefined` 가 되지 않고, 그래서 파이썬에는 `?.` 가 없다.
;
; `object:` 를 이름·부르기·꺼내기 셋으로 좁혔다. `(attribute)` 를 넣으면 `a.b.c` 가 사용처
; **둘**(안쪽 `a.b` 와 바깥 `a.b.c`)이 되어 한 줄에 카드가 두 장 난다 — `f-string.scm` 이
; `@site` 를 문자열 전체가 아니라 칸 하나에 둔 것과 같은 이유다. 좁히면 `a.b.c` 는 안쪽 하나만 남는다.

; `res.status_code` · `self.name` — 꺼내는 자리.
((attribute
   object: [(identifier) (call) (subscript) (parenthesized_expression)] @pick.2
   "." @pick.1 @hole
   attribute: (identifier) @pick.3) @site
 (#set! form "read"))
