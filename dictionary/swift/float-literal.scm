; 소수 값. 2진 분수의 합으로 담기므로 십진 소수는 대개 근사값이 된다.
; 구멍은 타입 이름이다 — `Double` 과 `Float` 의 갈림이 이 개념의 오개념(「Float 는 정확하다」)과 같다.
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (user_type (type_identifier) @pick.3 @hole))?
   value: (real_literal) @pick.1) @site
 (#set! form "floatlit"))

; 근사값 둘로 하는 셈. 왼쪽이 소수 리터럴인 자리만 잡는다 — 양쪽이 이름이면 타입이 소스에 없다.
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (user_type (type_identifier) @pick.3 @hole))?
   value: (additive_expression lhs: (real_literal) @pick.1)) @site
 (#set! form "floatop"))

((parameter
   name: (simple_identifier) @pick.2
   (user_type (type_identifier) @pick.3 @hole)) @site
 (#any-of? @pick.3 "Double" "Float" "CGFloat")
 (#set! form "floatparam"))
