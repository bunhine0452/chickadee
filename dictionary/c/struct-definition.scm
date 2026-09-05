; 값 여럿 묶어 새 이름 붙이기. 몸통이 있는 정의만 잡는다 — `struct P p;` 는 쓰는 자리다.
; 이름 없는 구조체는 `typedef` 가 이름을 준다 — `!name` 으로 갈라 같은 줄이 두 번 잡히지 않게.
((struct_specifier
   "struct" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (field_declaration_list) @pick.3) @site
 (#set! form "named"))

((type_definition
   type: (struct_specifier
     !name
     "struct" @pick.1 @hole
     body: (field_declaration_list) @pick.3)
   declarator: (type_identifier) @pick.2) @site
 (#set! form "anonymous-typedef"))
