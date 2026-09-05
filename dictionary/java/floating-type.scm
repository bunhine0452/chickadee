; 실수 타입으로 이름 만들기. 자바의 실수는 **둘**이고 리터럴의 기본은 넓은 쪽이다.
((local_variable_declaration
   type: (floating_point_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "floatdecl"))

((field_declaration
   type: (floating_point_type) @pick.1 @hole
   declarator: (variable_declarator
     name: (identifier) @pick.2)) @site
 (#set! form "floatfield"))

((formal_parameter
   type: (floating_point_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#set! form "floatparam"))
