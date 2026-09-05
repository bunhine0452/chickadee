; 원시와 래퍼가 소리 없이 오가는 자리. 래퍼 타입의 이름이 서는 곳을 짚는다 —
; 그 이름에는 값 대신 없음이 들어갈 수 있다는 것이 이 개념의 요점이다.
((local_variable_declaration
   type: (type_identifier) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1 "Integer" "Long" "Double" "Float" "Short" "Byte" "Boolean" "Character")
 (#set! form "boxdecl"))

((field_declaration
   type: (type_identifier) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2)) @site
 (#any-of? @pick.1 "Integer" "Long" "Double" "Float" "Short" "Byte" "Boolean" "Character")
 (#set! form "boxfield"))

((formal_parameter
   type: (type_identifier) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "Integer" "Long" "Double" "Float" "Short" "Byte" "Boolean" "Character")
 (#set! form "boxparam"))
