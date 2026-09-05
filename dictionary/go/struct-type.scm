; 칸에 이름 붙여 묶기. 선언과 만들기 둘을 잡는다.
; 칸 하나하나를 잡지 않는 이유는 사이트 수 때문이다 — `field_declaration` 마다 매치가
; 나면 칸이 다섯인 구조체 하나가 사이트 다섯이 된다.
((type_declaration
   (type_spec
     name: (type_identifier) @pick.2
     type: (struct_type "struct" @pick.1 @hole (field_declaration_list) @pick.3))) @site
 (#set! form "decl"))

((composite_literal
   type: (type_identifier) @pick.2
   body: (literal_value) @pick.3) @site
 (#set! form "lit"))
