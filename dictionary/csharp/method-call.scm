; 메서드 부르기. 괄호가 「지금 돈다」의 표시이고, 같은 이름이 여럿일 수 있다(오버로딩) —
; 어느 것이 불릴지는 인자 타입이 정한다.
;
; 빈칸은 안 낸다 — 구멍이 인자 목록이라 사용처마다 글자가 다르다. yaml 의 `no_hole_reason`.
((invocation_expression
   function: (member_access_expression
     expression: (_) @pick.2
     name: (identifier) @pick.3)
   arguments: (argument_list) @pick.1) @site
 (#set! form "call"))

((invocation_expression
   function: (identifier) @pick.3
   arguments: (argument_list) @pick.1) @site
 (#set! form "call-self"))
