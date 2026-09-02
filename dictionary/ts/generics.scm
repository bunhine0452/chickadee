; 제네릭 — JS 에는 없다. `grammars` 가 [typescript, tsx] 뿐인 이유다.
; `function_declaration` 은 이름이 타입 매개변수보다 앞에 오므로 패턴도 그 순서로 쓴다.
((call_expression
   function: (_) @pick.1
   type_arguments: (type_arguments . (_) @pick.2)) @site
 (#set! form "call-type-args"))

((new_expression
   constructor: (_) @pick.1
   type_arguments: (type_arguments . (_) @pick.2)) @site
 (#set! form "new-type-args"))

((function_declaration
   name: (identifier) @pick.2
   type_parameters: (type_parameters (type_parameter name: (type_identifier) @pick.1))) @site
 (#set! form "fn-type-params"))
