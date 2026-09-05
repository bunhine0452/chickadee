; 조건 자리에 `bool` 만 온다 — 「참 같은 값」이 이 언어에 없다.
; 잡는 자리는 참·거짓 **값**이 놓이는 곳 셋이다. 타입이 `bool` 이기만 한 칸은 안 잡는다 —
; 그 자리는 `go/package-visibility`·`go/struct-type` 과 겹치고, 값이 안 보여 물을 것이 없다.
((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . [(true) (false)] @pick.3 .)) @site
 (#set! form "short"))

((var_spec
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole
   value: (expression_list [(true) (false)] @pick.3)) @site
 (#eq? @pick.1 "bool")
 (#set! form "vardecl"))

((return_statement (expression_list . [(true) (false)] @pick.3 .)) @site
 (#set! form "ret"))

((call_expression
   function: (_) @pick.2
   arguments: (argument_list [(true) (false)] @pick.3)) @site
 (#set! form "arg"))
