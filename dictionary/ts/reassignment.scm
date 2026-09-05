; 이미 있는 이름에 값을 다시 넣는다. 선언(`const`·`let`)과 달리 이름을 새로 만들지 않는다.
; `left:` 를 이름으로 좁힌다 — `obj.a = 1` 은 속성을 고치는 다른 일이다.
((assignment_expression
   left: (identifier) @pick.2
   "=" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "assign"))
