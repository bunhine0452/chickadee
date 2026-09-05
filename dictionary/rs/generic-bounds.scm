; 타입 자리 비우고 조건 걸기. 「아무 타입」이 아니라 「이 일을 할 줄 아는 타입」이라고 적는 것.
; 네 리포 합쳐 68곳 — 합성이 정본이다. 구멍은 `impl Trait` 의 `impl`.
((type_parameter
   name: (type_identifier) @pick.2
   bounds: (trait_bounds ":" @pick.3 . (_) @pick.1)) @site
 (#set! form "bound"))

((where_predicate
   left: (_) @pick.2
   bounds: (trait_bounds ":" @pick.3 . (_) @pick.1)) @site
 (#set! form "where"))

((function_item
   name: (identifier) @pick.2
   type_parameters: (type_parameters "<" @pick.3 . (type_parameter name: (type_identifier) @pick.1))) @site
 (#set! form "generic-fn"))

; `fn f(x: impl Display)` · `-> impl Iterator<…>` — 이름 없는 타입 자리에 조건만 적는다.
((abstract_type
   "impl" @pick.1 @hole
   trait: (_) @pick.2) @site
 (#set! form "impl-trait"))
