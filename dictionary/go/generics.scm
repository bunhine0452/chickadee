; 타입 자리 비워 두기. 1.18 에서야 들어와 아직 얇다 — `cli/cli` 에서 10곳 · 5파일이다.
; **메서드에는 못 붙는다**: `method_declaration` 에 `type_parameters` 필드가 아예 없다.
((function_declaration
   name: (identifier) @pick.2
   type_parameters: (type_parameter_list) @pick.1 @hole
   parameters: (parameter_list) @pick.3) @site
 (#set! form "func"))

((type_declaration
   (type_spec
     name: (type_identifier) @pick.2
     type_parameters: (type_parameter_list) @pick.1 @hole
     type: (_) @pick.3)) @site
 (#set! form "type"))
