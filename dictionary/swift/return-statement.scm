; 값 돌려주기. Swift 는 몸통이 **식 하나면 `return` 을 안 적는다** — SwiftUI 의 `var body` 에
; `return` 이 없는 이유가 그것이다. 그래서 돌려줄 타입이 적힌 자리도 같은 개념이 진다.
; (반환 타입은 `return_type:` 필드가 쿼리에서 안 맞아 자리로 잡는다 — 실측.)
((control_transfer_statement
   "return" @pick.1 @hole
   result: (_) @pick.2) @site
 (#set! form "ret"))

((function_declaration
   name: (simple_identifier) @pick.3
   (user_type (type_identifier) @pick.2)) @site
 (#set! form "rettype"))
