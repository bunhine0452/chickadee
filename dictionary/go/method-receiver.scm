; 타입에 함수 붙이기. 포인터 리시버와 값 리시버를 갈라 잡는다 — 그 둘의 차이가 판 전체다.
; `cli/cli` 실측은 포인터 597곳 대 값 123곳이다 (`go.md` §1).
((method_declaration
   receiver: (parameter_list (parameter_declaration
     name: (identifier) @pick.2
     type: (pointer_type "*" @pick.1 @hole (type_identifier) @pick.3)))
   name: (field_identifier) @pick.4
   body: (block)) @site
 (#set! form "ptr"))

((method_declaration
   receiver: (parameter_list (parameter_declaration
     name: (identifier) @pick.2
     type: (type_identifier) @pick.3))
   name: (field_identifier) @pick.4
   body: (block)) @site
 (#set! form "value"))
