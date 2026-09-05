; 세는 변수가 없다 — 인덱스가 아니라 **항목을 직접** 받는다. `for i in range(len(xs))` 는
; 다른 언어에서 온 습관이고, 파이썬은 `for x in xs` 가 기본이다.
;
; 컴프리헨션의 `for`(`for_in_clause`)는 안 잡는다 — 노드가 다르고 개념도 다르다
; (`py/list-comprehension`). 같은 낱말이 두 개념의 사용처가 되면 첫 노출이 겹친다
; (README §7 ② 「같은 세 줄이 다섯 번」의 자리).
;
; 패턴이 하나뿐인 이유: `for … else` 도 `async for` 도 같은 `for_statement` 라 패턴을 더하면
; 한 줄이 사용처 **둘**이 되어 카드가 두 장 난다. 표본 218파일에 `for … else` 는 0곳이다
; (`py.md` §2.5).

; `for x in xs:` — 왼쪽이 받는 이름, 오른쪽이 훑을 것.
((for_statement
   "for" @pick.1 @hole
   left: (_) @pick.2
   "in" @pick.4
   right: (_) @pick.3
   body: (block)) @site
 (#set! form "for"))
