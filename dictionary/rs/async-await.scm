; 기다리되 멈추지 않기. `.await` 가 없으면 `async fn` 은 **아무것도 안 한다** — 미래(Future)를
; 만들어 돌려줄 뿐이고, 실행기(tokio)가 그것을 굴린다. ai-pm 에서 `?` 다음으로 흔한 개념이다
; (rust-axis §2.1: `await` 2,571 · `async fn` 1,109). 구멍은 `await`.
((await_expression
   (_) @pick.2
   "." @pick.3
   "await" @pick.1 @hole) @site
 (#set! form "await"))

((function_item
   (function_modifiers "async" @pick.1)
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3) @site
 (#set! form "async-fn"))

((async_block
   "async" @pick.1
   (block "{" @pick.3) @pick.2) @site
 (#set! form "async-block"))
