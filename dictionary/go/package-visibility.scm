; 첫 글자가 대문자인가가 패키지 밖에서 보이는지를 정한다. `public`·`private` 낱말이 없다.
;
; **구조체 칸 이름에서만** 잡는다. 타입 선언은 `go/struct-type`·`go/interface-implicit` 이
; 이미 같은 노드를 사이트로 쓰고, 함수 이름은 `go/func-declaration` 이 쓴다 — 같은 줄이
; 세 개념의 첫 노출이 되는 것을 그렇게 피했다 (`README.md` §7 ②).
((field_declaration
   name: (field_identifier) @pick.1 @hole
   type: (_) @pick.2
   !tag) @site
 (#match? @pick.1 "^[A-Z]")
 (#set! form "field"))

; 태그가 붙은 칸. JSON 이름과 Go 이름이 **다르게** 적혀 있어, 대문자가 「JSON 때문」이
; 아니라 「패키지 밖에서 보이려고」임이 그 자리에서 보인다.
((field_declaration
   name: (field_identifier) @pick.1 @hole
   type: (_) @pick.2
   tag: (interpreted_string_literal) @pick.3) @site
 (#match? @pick.1 "^[A-Z]")
 (#set! form "tagged"))
