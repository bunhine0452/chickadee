; 종류가 다른 값을 손으로 옮기는 자리. Swift 는 변수끼리 절대 안 섞으므로 이 호출이 **필수**다.
; 구멍은 목표 타입 이름이고, 괄호를 따로 잡는 것은 「이것이 호출이다」를 짚게 하려는 것이다.
((call_expression
   (simple_identifier) @pick.1 @hole
   (call_suffix (value_arguments "(" @pick.2 (value_argument value: (_) @pick.3)))) @site
 (#any-of? @pick.1 "Int" "Int8" "Int16" "Int32" "Int64" "UInt" "UInt8" "UInt32" "UInt64"
                   "Double" "Float" "CGFloat" "String" "Bool" "Character")
 (#set! form "convert"))

; `as` 는 값을 안 바꾸고 보는 눈만 바꾼다. 같은 개념의 반대쪽 예로 든다.
((as_expression
   expr: (_) @pick.3
   (as_operator) @pick.2
   type: (user_type (type_identifier) @pick.1)) @site
 (#set! form "cast"))
