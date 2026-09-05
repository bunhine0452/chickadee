; 종류가 다른 값을 손으로 옮기는 자리. Swift 는 변수끼리 절대 안 섞으므로 이 호출이 **필수**다.
; 구멍은 목표 타입 이름이고, 괄호를 따로 잡는 것은 「이것이 호출이다」를 짚게 하려는 것이다.
((call_expression
   (simple_identifier) @pick.1 @hole
   (call_suffix (value_arguments "(" @pick.2 (value_argument value: (_) @pick.3)))) @site
 (#any-of? @pick.1 "Int" "Int8" "Int16" "Int32" "Int64" "UInt" "UInt8" "UInt32" "UInt64"
                   "Double" "Float" "CGFloat" "String" "Bool" "Character")
 (#set! form "convert"))

; `as` 는 값을 안 바꾸고 보는 눈만 바꾼다. 같은 개념의 반대쪽 예로 든다.
; 타입 자리는 필드 없이 잡는다 — 트리는 `name:` 을 찍지만 문법의 node-types 에는 없어 쿼리가
; 그 필드를 거부한다(2026-09-06 실측, `swift.md` §8 함정 ⑨ 와 같은 종류).
((as_expression
   expr: (_) @pick.3
   (as_operator) @pick.2
   (user_type (type_identifier) @pick.1)) @site
 (#set! form "cast"))
