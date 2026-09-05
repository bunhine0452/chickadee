; 줄줄이 세워 두면 합쳐 주는 것. 중괄호 안에 값을 쉼표도 `return` 도 없이 세워 두면
; 컴파일러가 그것을 합치는 호출로 바꾼다. **문법에는 흔적이 없다** — 앵커는 둘뿐이고
; (`some View` 반환과 `@ViewBuilder` 속성) 그 둘이 이 쿼리의 두 패턴이다 (swift.md §8).
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (opaque_type (user_type (type_identifier) @pick.1)))
   computed_value: (computed_property (statements) @pick.3)) @site
 (#set! form "body"))

((function_declaration
   (modifiers (attribute (user_type (type_identifier) @pick.1)))
   name: (simple_identifier) @pick.2
   body: (function_body (statements) @pick.3)) @site
 (#any-of? @pick.1 "ViewBuilder" "ToolbarContentBuilder" "SceneBuilder" "resultBuilder"
                   "CommandsBuilder")
 (#set! form "builder-func"))
