; `and`/`or` 는 참·거짓이 아니라 **피연산자 하나**를 돌려준다. `x = a or 0` 은 `a` 가 `0` 일 때도
; `0` 이라 「기본값」이 안 먹는다 — 파이썬에는 `??` 가 없어서 이 자리가 그 몫을 진다.
;
; 조건 자리(`if a and b:`)는 안 잡는다. 거기서는 돌려준 값이 곧바로 참·거짓으로 접혀
; 「값이 나온다」가 화면에서 안 보이기 때문이다. 값으로 **쓰이는** 세 자리만 잡는다.

; `x = a or b` — 담기는 것은 참·거짓이 아니라 둘 중 하나다.
((assignment
   left: (identifier) @pick.3
   right: (boolean_operator
            left: (_) @pick.2
            operator: ["or" "and"] @pick.1 @hole
            right: (_))) @site
 (#set! form "kept"))

; `return a or b` — 돌아가는 것도 마찬가지다.
((return_statement
   "return" @pick.3
   (boolean_operator
     left: (_) @pick.2
     operator: ["or" "and"] @pick.1 @hole
     right: (_))) @site
 (#set! form "returned"))

; `def f(x=a or b)` · `f(k=a or b)` — 기본값 자리.
((keyword_argument
   name: (identifier) @pick.3
   value: (boolean_operator
            left: (_) @pick.2
            operator: ["or" "and"] @pick.1 @hole
            right: (_))) @site
 (#set! form "default"))
