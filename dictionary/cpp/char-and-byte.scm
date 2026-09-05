; 글자와 바이트. 두 자리에서 갈린다 — 작은따옴표 하나가 `char` 한 개라는 것과,
; 길이를 묻는 호출이 **글자 수가 아니라 바이트 수**를 돌려준다는 것.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (char_literal) @pick.3)) @site
 (#eq? @pick.1 "char")
 (#set! form "chardecl"))

; `s.length()` — 한글 한 글자가 3 을 더한다. `size()` 는 안 잡는다: 목록·맵에도 붙어 있어
; 캡처가 부풀고 그 대부분이 글자와 무관하다.
((call_expression
   function: (field_expression
     argument: (identifier) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (argument_list) @pick.3) @site
 (#eq? @pick.1 "length")
 (#set! form "measure"))
