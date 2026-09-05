; 없을 수 있는 값. Swift 는 「없음」을 상태가 아니라 **타입**에 적는다 — `String` 과 `String?` 은
; 다른 타입이다. 물음표까지가 한 타입이고 감싼 타입은 `wrapped:` 다.
;
; `type_annotation` 에는 필드 이름을 안 붙인다 — 이 문법의 `type:` 은 `node-types.json` 에
; 적혀 있는데 실제 쿼리에서는 하나도 안 맞는다(실측). 자리로 잡아야 한다.
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (optional_type wrapped: (user_type (type_identifier) @pick.3)) @pick.1)) @site
 (#set! form "optprop"))

((parameter
   name: (simple_identifier) @pick.2
   (optional_type wrapped: (user_type (type_identifier) @pick.3)) @pick.1) @site
 (#set! form "optparam"))

((function_declaration
   name: (simple_identifier) @pick.2
   (optional_type wrapped: (user_type (type_identifier) @pick.3)) @pick.1) @site
 (#set! form "optreturn"))
