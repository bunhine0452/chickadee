; 기다렸다 값 꺼내기. `await` 를 적을 수 있는 곳이 `async` 함수 안뿐이라 한 번 쓰면
; 부르는 쪽까지 전부 `async` 가 된다.
((await_expression
   "await" @pick.1 @hole
   expr: (_) @pick.2) @site
 (#set! form "await"))

((function_declaration
   name: (simple_identifier) @pick.2
   "async" @pick.1 @hole
   body: (function_body (statements) @pick.3)) @site
 (#set! form "async"))
