; `int()`·`float()`·`str()`·`bool()` 은 값을 **바꾸는** 것이 아니라 **새 값을 만든다.**
; 넣어 준 값은 그대로 남는다. 여는 괄호도 짚을 자리다 — 새 값이 시작되는 곳이 거기다.
;
; `int("3.7")` 이 3 이 아니라 `ValueError` 인 것이 이 개념의 날카로운 자리다.
; `int(3.7)` 은 3 이고, 같은 이름이 넣는 것에 따라 다르게 군다.

((call
   function: (identifier) @pick.1
   arguments: (argument_list "(" @pick.2 . (_) @pick.3)) @site
 (#match? @pick.1 "^(int|float|str|bool|bytes)$")
 (#set! form "cast"))

; 인자가 없는 `int()`·`str()` — 그 종류의 「빈 값」이 나온다. `int()` 는 0, `str()` 은 빈 글자.
((call
   function: (identifier) @pick.1
   arguments: (argument_list . "(" @pick.2 . ")" @pick.3)) @site
 (#match? @pick.1 "^(int|float|str|bool|bytes)$")
 (#set! form "empty-cast"))
