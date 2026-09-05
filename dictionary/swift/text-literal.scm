; 글자 묶음. Swift 의 `String` 은 바이트도 코드 단위도 아니라 **자소 뭉치**의 모음이다.
; 길이를 재는 호출(`count`·`utf8.count`)은 안 잡는다 — `count` 는 배열에도 있어 정적으로 못 가른다.
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (user_type (type_identifier) @pick.3 @hole))?
   value: (line_string_literal) @pick.1) @site
 (#set! form "strlit"))

; 글자가 인자로 그대로 들어가는 자리. SwiftUI 화면 코드에서 가장 흔한 문자열 사용처다.
((call_expression
   (simple_identifier) @pick.2
   (call_suffix (value_arguments "(" (value_argument value: (line_string_literal) @pick.1)))) @site
 (#set! form "strarg"))
