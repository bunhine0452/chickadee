; 정수 값과 그 폭. 폭을 정하는 것은 **타입 이름**이고, 안 적으면 `Int` 다.
; 구멍은 타입 이름에만 뚫는다 — 값을 구멍으로 삼으면 「아무 수나 들어간다」가 되어 보기가 안 선다.
;
; 타입을 안 적은 줄(`let n = 42`)도 사용처다. 폭이 안 보인다는 것이 이 개념의 절반이라
; 어노테이션은 `?` 로 열어 둔다 — 그러면 한 패턴이 두 꼴을 다 잡고 겹쳐 세지 않는다.
; `type_annotation` 과 `parameter` 의 타입에는 필드 이름을 안 붙인다 — 이 문법의 `type:` 은
; `node-types.json` 에 있는데 쿼리에서 하나도 안 맞는다(실측).
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (user_type (type_identifier) @pick.3 @hole))?
   value: (integer_literal) @pick.1) @site
 (#set! form "intlit"))

((parameter
   name: (simple_identifier) @pick.2
   (user_type (type_identifier) @pick.3 @hole)) @site
 (#any-of? @pick.3 "Int" "Int8" "Int16" "Int32" "Int64" "UInt" "UInt8" "UInt16" "UInt32" "UInt64")
 (#set! form "intparam"))

; 폭이 코드에 이름으로 드러나는 유일한 자리 — `Int8.max` · `Int.min`.
((navigation_expression
   target: (simple_identifier) @pick.3
   suffix: (navigation_suffix suffix: (simple_identifier) @pick.1)) @site
 (#any-of? @pick.3 "Int" "Int8" "Int16" "Int32" "Int64" "UInt" "UInt8" "UInt16" "UInt32" "UInt64")
 (#any-of? @pick.1 "max" "min")
 (#set! form "limit"))
