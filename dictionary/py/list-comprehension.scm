; **읽는 순서와 도는 순서가 다르다** — 결과 식이 맨 앞이고 `for` 가 뒤다. 그런데 도는 것은
; `for` 가 먼저다. 그 어긋남이 이 문법을 처음 볼 때 막히는 자리 전부다.
;
; 걸러내기도 같은 괄호 안에서 한다. 파이썬에는 `.filter()` 메서드가 없고 내장 `filter()` 는
; 게으른 이터레이터를 돌려주어 거의 안 쓰이므로, `if` 절 하나가 `common/filter-select` 를 겸한다
; (`py.md` §3 의 마지막 문단).
;
; `if_clause` 를 **선택 캡처**로 둔다. 패턴을 둘로 나누면 `[x for x in xs if ok(x)]` 가 사용처
; 둘이 되어 한 줄에 카드가 두 장 난다 — `if-statement.scm` 이 `alternative: (_)?` 를 쓴 것과 같다.

; `[f(x) for x in xs]` · `[x for x in xs if ok(x)]`
((list_comprehension
   body: (_) @pick.2
   (for_in_clause
     "for" @pick.1 @hole
     left: (_) @pick.3
     right: (_))
   (if_clause)? @pick.4) @site
 (#set! form "list"))

; `{k: v for k, v in d.items()}` — 같은 문법이 사전도 만든다. 결과 식이 `키: 값` 한 쌍이다.
((dictionary_comprehension
   body: (pair) @pick.2
   (for_in_clause
     "for" @pick.1 @hole
     left: (_) @pick.3
     right: (_))) @site
 (#set! form "dict"))

; `(x for x in xs)` — 대괄호를 괄호로 바꾸면 목록이 아니라 **그때그때 하나씩**이 된다.
; 겉이 거의 같은데 만들어지는 것이 다른 자리다.
((generator_expression
   body: (_) @pick.2
   (for_in_clause
     "for" @pick.1 @hole
     left: (_) @pick.3
     right: (_))) @site
 (#set! form "lazy"))
