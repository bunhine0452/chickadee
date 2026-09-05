; 같은 이름 다른 몸통. 어느 몸통이 불릴지 **실행할 때** 정해지게 하는 표시와, 재정의임을
; 컴파일러에게 확인시키는 표시 둘이다 (`cpp.md` §4 #27).
((field_declaration
   "virtual" @pick.1 @hole
   type: (_) @pick.3
   declarator: (function_declarator declarator: (field_identifier) @pick.2)) @site
 (#set! form "virtual"))

((field_declaration
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (field_identifier) @pick.2
     (virtual_specifier) @pick.1 @hole)) @site
 (#set! form "override"))

((function_definition
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (field_identifier) @pick.2
     (virtual_specifier) @pick.1 @hole)) @site
 (#set! form "override-def"))
