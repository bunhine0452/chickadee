; 괄호가 없으면 함수가 **값 그 자체**다. `f` 와 `f()` 가 둘 다 문법에 맞으므로 괄호를
; 빠뜨린 오타가 오류 없이 지나간다 — 파이썬은 함수도 객체라서 그 줄이 성립한다.
;
; `@site` 를 여는 괄호가 든 매치에 두고 `@hole` 도 거기 둔다. 부르는 일이 일어나는 자리가
; 이름이 아니라 **괄호**이기 때문이다.

; `f(x)` — 이름 뒤의 괄호.
((call
   function: (identifier) @pick.2
   arguments: (argument_list "(" @pick.1 @hole . (_) @pick.3)) @site
 (#set! form "call"))

; `obj.method(x)` — 부르는 것이 이름이 아니라 안에서 꺼낸 것일 때. 꺼내기(`.`)와 부르기(`()`)가
; 한 줄에 붙어 있어서 둘을 한 가지 일로 읽기 쉽다.
((call
   function: (attribute attribute: (identifier) @pick.2)
   arguments: (argument_list "(" @pick.1 @hole . (_) @pick.3)) @site
 (#set! form "method"))

; `f()` — 인자가 없어도 괄호는 있어야 돈다. 여기가 「이름만 적으면 안 돈다」가 가장 잘 보이는 자리다.
((call
   function: (identifier) @pick.2
   arguments: (argument_list . "(" @pick.1 @hole . ")" @pick.3)) @site
 (#set! form "noarg"))
