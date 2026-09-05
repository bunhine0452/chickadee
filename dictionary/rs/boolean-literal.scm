; 참·거짓. 조건 자리에 `bool` **만** 온다 — `if 1` 도 `if opt` 도 E0308. 그래서 짚는 자리는
; 값 둘만이 아니라 `bool` 이라는 **타입이 적힌 곳**이다 — 참·거짓을 돌려주는 함수가 가장 두껍다.
((let_declaration
   "let" @pick.3
   pattern: (identifier) @pick.2
   value: (boolean_literal) @pick.1) @site
 (#set! form "bool-let"))

((function_item
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3
   return_type: (primitive_type) @pick.1 @hole) @site
 (#eq? @pick.1 "bool")
 (#set! form "bool-fn"))

((field_declaration
   name: (field_identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#eq? @pick.1 "bool")
 (#set! form "bool-field"))

((parameter
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#eq? @pick.1 "bool")
 (#set! form "bool-param"))
