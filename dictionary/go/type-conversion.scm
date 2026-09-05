; 타입은 손으로만 바꾼다 — `T(x)`. Go 에 암묵 변환이 없으므로 **변환은 언제나 코드에
; 적혀 있고**, 그래서 이 개념은 정적으로 전부 보인다(파이썬·TS 의 `implicit-conversion`
; 이 0곳이던 것의 정확한 반대다).
;
; 첫 패턴이 좁은 판(담기는 이름까지 보인다), 둘째가 넓은 판, 셋째는 타입이 이름이 아닌
; 것(`[]byte(s)`·`*T(p)`)이라 문법이 아예 다른 노드를 낸다.
((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (call_expression
     function: (identifier) @pick.1 @hole
     arguments: (argument_list . (_) @pick.3 .)) .)) @site
 (#any-of? @pick.1 "int" "int8" "int16" "int32" "int64" "uint" "uint8" "uint16" "uint32" "uint64" "byte" "rune" "uintptr" "float64" "float32" "string" "bool" "complex64" "complex128")
 (#set! form "convdecl"))

((call_expression
   function: (identifier) @pick.1 @hole
   arguments: (argument_list . (_) @pick.3 .)) @site
 (#any-of? @pick.1 "int" "int8" "int16" "int32" "int64" "uint" "uint8" "uint16" "uint32" "uint64" "byte" "rune" "uintptr" "float64" "float32" "string" "bool" "complex64" "complex128")
 (#set! form "conv"))

((type_conversion_expression
   type: (_) @pick.1 @hole
   operand: (_) @pick.3) @site
 (#set! form "convtype"))
