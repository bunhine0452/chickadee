; 규약 지키기. 상속과 **똑같은 콜론**을 쓴다 — `struct X: View` 는 상속이 아니라
; 「이 규약을 지킨다」인데 문법으로는 구별이 안 된다 (swift.md §8 함정 ⑦).
; 그래서 `struct`·`enum` 으로 좁힌다: 값 타입에는 상속이 없으므로 남는 뜻은 채택 하나다.
((class_declaration
   declaration_kind: ["struct" "enum"] @pick.3
   name: (type_identifier) @pick.2
   (inheritance_specifier inherits_from: (user_type (type_identifier) @pick.1))) @site
 (#set! form "conform"))

((protocol_declaration
   name: (type_identifier) @pick.2
   (inheritance_specifier inherits_from: (user_type (type_identifier) @pick.1))) @site
 (#set! form "protocol-inherits"))
