; 함수 정의하기. **타입이 이름 뒤**에 오고 반환 타입은 괄호 뒤에 온다.
; 반환값이 없는 것 · 하나인 것 · 여럿인 것을 갈라 잡는다. `!result` 가 없으면 셋이 겹쳐
; 사이트가 배가 된다.
;
; 반환이 `error` 하나뿐인 함수는 뺐다 — 그 자리는 `go/nil-interface` 의 것이다
; (`README.md` §7 ②).
((function_declaration
   "func" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (parameter_list) @pick.3
   !result
   body: (block) @pick.4) @site
 (#set! form "void"))

((function_declaration
   "func" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (parameter_list) @pick.3
   result: (type_identifier) @pick.5
   body: (block) @pick.4) @site
 (#not-eq? @pick.5 "error")
 (#set! form "one"))

((function_declaration
   "func" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (parameter_list) @pick.3
   result: (parameter_list) @pick.5
   body: (block) @pick.4) @site
 (#set! form "many"))
