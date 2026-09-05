; 값에 붙은 함수. 첫 인자가 `self`·`&self`·`&mut self` 중 무엇인지가 「이 메서드가 값을
; 먹는가」를 정한다 — `into_`·`as_`·`to_` 이름 규칙의 근거. `impl Trait for` 는
; `rs/impl-trait-for` 가 가져간다(`!trait`).
((impl_item
   !trait
   "impl" @pick.1 @hole
   type: (_) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "impl"))

((function_item
   name: (identifier) @pick.2
   parameters: (parameters . (self_parameter) @pick.1)
   body: (block) @pick.3) @site
 (#set! form "method"))
