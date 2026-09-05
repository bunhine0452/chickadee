; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; **`computed_property` 가 들어 있다**(swift.md §8 「그 밖의 배선」). SwiftUI 의 `var body` 는
; 함수가 아니라 계산 속성이라 `function_declaration` 만 잡으면 화면 코드에서 고를 블록이
; 하나도 안 나온다 — 표본 `IceCubesApp` 428파일 실측에서 `var body: some View` 가 175곳이고
; 그 파일들의 `function_declaration` 은 그보다 적다.
;
; `class_declaration` 은 다섯을 겸한다(swift.md §8 함정 ①) — `struct`·`class`·`enum`·
; `extension`·`actor`. 블록 후보로는 다섯 다 맞으므로 `declaration_kind` 로 안 좁히고,
; 다만 `extension` 은 `name:` 이 `user_type` 이라 별도 패턴이 필요하다.
((function_declaration name: (simple_identifier) @block.name) @block.function
 (#set! form "func"))

((init_declaration name: _ @block.name) @block.function
 (#set! form "init"))

((class_declaration name: (type_identifier) @block.name) @block.function
 (#set! form "type"))

((class_declaration
   declaration_kind: "extension"
   name: (user_type (type_identifier) @block.name)) @block.function
 (#set! form "extension"))

((protocol_declaration name: (type_identifier) @block.name) @block.function
 (#set! form "protocol"))

((property_declaration
   name: (pattern (simple_identifier) @block.name)
   computed_value: (computed_property)) @block.function
 (#set! form "computed"))
