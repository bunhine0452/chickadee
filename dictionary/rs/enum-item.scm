; 갈래마다 다른 값. Rust 의 `enum` 은 갈래마다 **값을 담는다** — `Option`·`Result` 가 특별한
; 문법이 아니라 그냥 이 `enum` 이다. 구멍은 `enum`.
((enum_item
   "enum" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (enum_variant_list) @pick.3) @site
 (#set! form "enum"))

; 값을 담은 갈래 — `Circle(f64)` · `Move { x: i32 }`.
((enum_variant
   name: (identifier) @pick.2
   body: [(ordered_field_declaration_list "(" @pick.1 . (_) @pick.3)
          (field_declaration_list "{" @pick.1 . (_) @pick.3)]) @site
 (#set! form "variant-with-data"))
