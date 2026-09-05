; `Number()` · `parseInt()` · `String()` · `Boolean()` · `!!` — **새 값을 만든다.**
; 원래 값은 그대로 남는다. 여는 괄호도 짚을 자리다 — 새 값이 시작되는 곳이 거기다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments
                "(" @pick.2
                .
                (_) @pick.3)) @site
 (#match? @pick.1 "^(Number|String|Boolean|parseInt|parseFloat)$")
 (#set! form "cast"))

; `!!x` — 두 번 뒤집어 참·거짓 값을 만든다. 값은 안 바뀌고 종류만 바뀐다.
((unary_expression
   operator: "!" @pick.1
   argument: (unary_expression
               operator: "!" @pick.2
               argument: (_) @pick.3)) @site
 (#set! form "double-negate"))
