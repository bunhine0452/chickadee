; 변환은 셋 중 하나다 — `as`(잃어도 조용) · `From`/`Into`(안 잃는 것만) · `TryFrom`/`try_into`
; (실패가 Result 로 온다). 실측에서 `as` 563곳 대 `try_into` 12곳, 47배 (rs.md §0.7 ①).
; 계단 사이에 **자동으로 도는 화살표가 하나도 없다**는 것이 이 개념의 요점이라 셋을 한 쿼리에 둔다.
((type_cast_expression
   value: (_) @pick.2
   "as" @pick.1 @hole
   type: (_) @pick.3) @site
 (#set! form "as"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "try_into" "into")
 (#set! form "into"))

((call_expression
   function: (scoped_identifier
     path: (_) @pick.2
     name: (identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "try_from" "from")
 (#set! form "from"))
