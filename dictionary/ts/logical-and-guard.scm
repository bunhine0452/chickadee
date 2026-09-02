; `a && a.b` — 왼쪽으로 지키고 오른쪽에서 읽는다.
; #eq? 가 「지키는 값과 읽는 값이 같다」를 강제한다 — 그래야 `?.` 의 혼동 쌍이 된다.
((binary_expression
   left: (_) @pick.1
   operator: "&&" @pick.2
   right: (member_expression object: (_) @ctx.object property: (_) @pick.3)) @site
 (#eq? @pick.1 @ctx.object)
 (#set! form "guard"))

; `a && a.b()` — 읽는 대신 부르는 자리.
((binary_expression
   left: (_) @pick.1
   operator: "&&" @pick.2
   right: (call_expression
            function: (member_expression object: (_) @ctx.object property: (_) @pick.3))) @site
 (#eq? @pick.1 @ctx.object)
 (#set! form "guard-call"))
