; `await` 다음 줄은 언제 도나. 대기줄이 둘이라는 사실은 노드 하나로 안 보이므로,
; 두 줄이 각각 어느 줄에 서는지를 두 패턴으로 갈라 잡는다.
((await_expression (_) @pick.2) @site @pick.1
 (#set! form "micro"))

; 태스크 줄에 서는 쪽 — 마이크로태스크가 다 빈 뒤에야 하나 꺼내진다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments . (_) @pick.3)) @site
 (#any-of? @pick.1 "setTimeout" "setInterval" "setImmediate")
 (#set! form "task"))
