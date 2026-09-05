; 이름에 값이 붙는 줄. Swift 는 이름을 만드는 줄에서 **바뀔 이름인지까지** 골라야 한다.
; 구멍은 `let`/`var` 이고, 다시 넣는 줄(`n = 5`)은 다른 노드라 `form` 으로 갈라 둔다.
((property_declaration
   (value_binding_pattern mutability: _ @pick.1 @hole)
   name: (pattern (simple_identifier) @pick.2)
   value: (_) @pick.3) @site
 (#set! form "bind"))

((assignment
   target: (directly_assignable_expression (simple_identifier) @pick.2)
   operator: "=" @pick.1
   result: (_) @pick.3) @site
 (#set! form "rebind"))
