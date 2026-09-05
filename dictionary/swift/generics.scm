; 타입 자리 비워 두기. Swift 는 비워 둔 자리에 **조건을 걸 수 있다** — `<T: Equatable>`.
; 그래서 「아무 타입이나」가 아니라 「이 규약을 지키는 아무 타입」이다.
; 조건은 `?` 로 열어 둔다 — 조건 있는 판과 없는 판을 따로 적으면 같은 자리가 두 번 세어진다.
((function_declaration
   name: (simple_identifier) @pick.2
   (type_parameters
     (type_parameter (type_identifier) @pick.1 (user_type (type_identifier) @pick.3)?))) @site
 (#set! form "generic-func"))

((class_declaration
   name: (type_identifier) @pick.2
   (type_parameters
     (type_parameter (type_identifier) @pick.1 (user_type (type_identifier) @pick.3)?))) @site
 (#set! form "generic-type"))
