; 정수의 폭과 부호. Rust 는 **이름에 적혀 있다** — `u8`·`i64`·`usize`. 사용처가 두꺼운 이유다
; (rs.md §0.7 ②: 폭 붙은 이름 2,885곳).
;
; `usize` 가 구멍의 정본이다 — 길이·색인 자리의 타입이고 `i32` 와 못 더한다는 것이 이 개념이
; 잡는 첫 오류(E0308)다. 다른 폭의 자리는 짚기만 하고 빈칸은 안 낸다(첫 보기와 다르면 생성기가 뺀다).
((let_declaration
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole
   value: (_) @pick.3) @site
 (#match? @pick.1 "^[iu](8|16|32|64|128|size)$")
 (#set! form "int-let"))

((parameter
   pattern: (identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#match? @pick.1 "^[iu](8|16|32|64|128|size)$")
 (#set! form "int-param"))

((field_declaration
   name: (field_identifier) @pick.2
   type: (primitive_type) @pick.1 @hole) @site
 (#match? @pick.1 "^[iu](8|16|32|64|128|size)$")
 (#set! form "int-field"))

((function_item
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3
   return_type: (primitive_type) @pick.1 @hole) @site
 (#match? @pick.1 "^[iu](8|16|32|64|128|size)$")
 (#set! form "int-return"))

; 리터럴에 붙은 접미사 — `1u8` · `0usize`. 값 옆에 폭을 적는 자리.
((integer_literal) @site @pick.1
 (#match? @pick.1 "[iu](8|16|32|64|128|size)$")
 (#set! form "int-suffix"))
