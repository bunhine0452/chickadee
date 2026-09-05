; 일찍 돌려주기. Rust 에서 `return` 은 대개 **안 쓴다** — 마지막 식이 답이다(`rs/tail-expression`).
; 쓰는 자리는 중간에서 나가는 곳이고, `_lang.yaml` 의 `alternatives` 가 이 둘을 짝으로 든다.
((expression_statement
   (return_expression
     "return" @pick.1 @hole
     (_) @pick.2)
   ";" @pick.3) @site
 (#set! form "return"))

((return_expression) @site @pick.1
 (#eq? @site "return")
 (#set! form "bare"))
