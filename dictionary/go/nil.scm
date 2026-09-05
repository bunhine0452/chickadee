; 값이 없음. **견주기가 아니라 값으로 쓰인 `nil`** 만 잡는다 — `x != nil` 은
; `go/error-check` 의 자리이고, 값 둘을 돌려주는 `return v, nil` 은 `go/return-multi` 의
; 자리다. 여기 남는 것은 `return nil` 하나짜리 · 인자로 넘긴 nil · 다시 넣는 nil 이다.
((return_statement (expression_list . (nil) @pick.1 @hole .)) @site
 (#set! form "ret"))

((call_expression
   function: (selector_expression
     operand: (identifier) @pick.3
     field: (field_identifier) @pick.2)
   arguments: (argument_list (nil) @pick.1 @hole)) @site
 (#set! form "arg"))

((assignment_statement
   left: (expression_list . (_) @pick.2 .)
   operator: "=" @pick.3
   right: (expression_list . (nil) @pick.1 @hole .)) @site
 (#set! form "assign"))
