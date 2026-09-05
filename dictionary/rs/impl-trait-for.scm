; 트레이트를 붙이기. `#[derive(Debug, Clone)]` 한 줄이 구현을 **생성한다** — 이 리포도
; `derive` 615 대 손으로 쓴 `impl … for` 48 이다 (rust-axis §2.1). 구멍은 `derive`.
((impl_item
   "impl" @pick.3
   trait: (_) @pick.1
   "for" @pick.4
   type: (_) @pick.2) @site
 (#set! form "impl-for"))

((attribute_item
   "#" @pick.3
   (attribute
     (identifier) @pick.1 @hole
     arguments: (token_tree) @pick.2)) @site
 (#eq? @pick.1 "derive")
 (#set! form "derive"))
