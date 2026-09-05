; 함수 정의. 매개변수·반환 **타입을 반드시 적는다** — 추론이 함수 경계를 안 넘는다.
; `-> T` 가 없으면 `()` 를 돌려준다는 뜻이고, 그것이 `rs/tail-expression` 의 E0308 로 이어진다.
((function_item
   "fn" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3
   return_type: (_)? @pick.4
   body: (block) @pick.5) @site
 (#set! form "fn"))
