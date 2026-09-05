; 하나로 정해진 타입과 그때그때 다른 타입. `some View` 는 「아무 뷰나」가 아니라
; **하나로 정해진 어떤 타입**이고 컴파일러가 그것을 안다. `any` 는 그 반대쪽이다.
;
; 반환 타입에는 필드 이름을 안 붙인다 — 이 문법의 `return_type:` 은 `node-types.json` 에
; 있는데 쿼리에서 하나도 안 맞는다(실측). 반환 타입은 함수의 **자리로** 잡는다.
((function_declaration
   name: (simple_identifier) @pick.2
   (opaque_type "some" @pick.1 @hole (user_type (type_identifier) @pick.3))) @site
 (#set! form "some-return"))

((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (opaque_type "some" @pick.1 @hole (user_type (type_identifier) @pick.3)))) @site
 (#set! form "some-prop"))

((parameter
   name: (simple_identifier) @pick.2
   (existential_type "any" @pick.1 @hole (user_type (type_identifier) @pick.3))) @site
 (#set! form "any-param"))
