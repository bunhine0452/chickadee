; `string` 은 바이트열이다. 잡는 자리는 글자 값이 이름에 담기는 곳과, **바이트 하나를
; 꺼내는 곳**(`s[0]`)이다 — 뒤의 것이 「한 글자가 한 바이트가 아니다」가 보이는 자리다.
((var_spec
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole
   value: (expression_list (interpreted_string_literal) @pick.3)) @site
 (#eq? @pick.1 "string")
 (#set! form "vardecl"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (interpreted_string_literal) @pick.3 .)) @site
 (#set! form "short"))

((call_expression
   function: (identifier) @pick.1 @hole
   arguments: (argument_list . (identifier) @pick.3 .)) @site
 (#eq? @pick.1 "len")
 (#set! form "len"))
