; 이미 있는 이름에 값을 다시 넣는 줄. 구멍은 넣는 기호이고, 요점은 그 넣기가
; **통째 복사**라는 것이다 — `std::vector` 든 `std::string` 이든 오른쪽이 그대로 안 남는다.
;
; 왼쪽이 식별자인 것만 잡는다. `obj.field = 1` 은 멤버에 넣는 다른 판이고,
; `*p = 1` 은 포인터를 먼저 알아야 한다.
((assignment_expression
   left: (identifier) @pick.2
   operator: "=" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "assign"))
