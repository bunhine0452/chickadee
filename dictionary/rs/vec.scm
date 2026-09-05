; 순서 있는 목록. 길이가 변하는 목록은 전부 `Vec` 이고 `[T; 3]` 배열과 **다른 타입**이다.
; `push` 하려면 `let mut` 이어야 한다 — 그 연결이 이 개념의 규칙이다.
;
; 구멍은 `Vec` 이다(타입 자리와 `Vec::new`). `vec![…]` 의 `vec` 은 짚기만 한다 — 첫 보기와
; 글자가 달라 빈칸이 안 선다.
((generic_type
   type: (type_identifier) @pick.1 @hole
   type_arguments: (type_arguments "<" @pick.3 . (_) @pick.2)) @site
 (#eq? @pick.1 "Vec")
 (#set! form "vec-type"))

((call_expression
   function: (scoped_identifier
     path: (identifier) @pick.1 @hole
     name: (identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "Vec")
 (#any-of? @pick.2 "new" "with_capacity")
 (#set! form "vec-new"))

((macro_invocation
   macro: (identifier) @pick.1
   "!" @pick.3
   (token_tree) @pick.2) @site
 (#eq? @pick.1 "vec")
 (#set! form "vec-macro"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "push" "pop")
 (#set! form "push"))
