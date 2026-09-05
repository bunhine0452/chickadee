; 값 여럿 돌려주기. **정확히 둘**인 것만 잡는다 — 그것이 Go 의 `(값, error)` 짝이고,
; 하나짜리 `return nil` 은 `go/nil` 의 자리다(둘이 겹치면 첫 노출이 같은 줄이 된다).
((return_statement
   "return" @pick.1 @hole
   (expression_list . (_) @pick.2 . (_) @pick.3 .)) @site
 (#set! form "two"))
