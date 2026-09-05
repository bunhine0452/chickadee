; 바깥 값을 데려가는 함수. 「데려간다」는 것은 정적으로 못 본다 — 이름이 바깥 것인지 알려면
; 스코프를 풀어야 하는데 쿼리에는 그것이 없다. 그래서 여기서는 **닫힘이 생기는 모양**을 잡는다:
; 함수 안에서 함수가 만들어져 그 함수보다 오래 사는 세 꼴이다.
((function_declaration
   name: (_) @pick.1
   body: (statement_block
     (return_statement [(arrow_function) (function_expression)] @pick.2))) @site
 (#set! form "returns-fn"))

; `const make = (a) => (b) => a + b` — 화살표가 화살표를 낸다.
((arrow_function
   body: (arrow_function body: (_) @pick.3) @pick.2) @site @pick.1
 (#set! form "curried"))

; 타이머·마이크로태스크에 넘긴 함수 — 그 함수가 도는 시점에 바깥 줄은 이미 지나갔다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments . [(arrow_function) (function_expression)] @pick.2)) @site
 (#any-of? @pick.1 "setTimeout" "setInterval" "queueMicrotask" "requestAnimationFrame")
 (#set! form "deferred"))
