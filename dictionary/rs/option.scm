; 없을 수 있는 값. Rust 에 `null` 이 없다 — 「없을 수 있음」이 타입에 적혀 있고 꺼내려면
; 반드시 갈라야 한다. 구멍은 `Option`.
((generic_type
   type: (type_identifier) @pick.1 @hole
   type_arguments: (type_arguments "<" @pick.3 . (_) @pick.2)) @site
 (#eq? @pick.1 "Option")
 (#set! form "option-type"))

((call_expression
   function: (identifier) @pick.1
   arguments: (arguments "(" @pick.3 . (_) @pick.2)) @site
 (#eq? @pick.1 "Some")
 (#set! form "some"))

; `if let Some(v) = opt` — 있을 때만 꺼내는 자리.
((let_condition
   pattern: (tuple_struct_pattern type: (identifier) @pick.1 . (_) @pick.2)
   value: (_) @pick.3) @site
 (#eq? @pick.1 "Some")
 (#set! form "if-let-some"))

((match_arm
   pattern: (match_pattern (identifier) @pick.1)
   "=>" @pick.3
   value: (_) @pick.2) @site
 (#eq? @pick.1 "None")
 (#set! form "none-arm"))
