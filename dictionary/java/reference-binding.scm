; 이름에 이름을 넣는 자리. 원시면 값이 복사되고 참조면 자리가 복사된다 —
; 같은 문법에 규칙이 둘이라는 것이 이 개념이다.
((local_variable_declaration
   type: (_) @pick.1
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (identifier) @pick.3)) @site
 (#set! form "alias"))

((assignment_expression
   left: (identifier) @pick.2
   operator: "=" @pick.1
   right: (identifier) @pick.3) @site
 (#set! form "rebind"))
