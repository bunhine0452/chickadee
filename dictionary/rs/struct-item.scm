; 값 묶어 이름 붙이기. 필드마다 타입이 있고 **전부 채워야** 만들어진다 — 부분만 채운 값이 존재할
; 수 없다. 구멍은 `struct`.
((struct_item
   "struct" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (_) @pick.3) @site
 (#set! form "struct"))

; `Point { x: 1, y: 2 }` — 만드는 자리. 필드를 빠뜨리면 E0063.
((struct_expression
   name: (_) @pick.2
   body: (field_initializer_list "{" @pick.1 . (_) @pick.3)) @site
 (#set! form "make"))
