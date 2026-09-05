; 끝날 때 하는 일. 요점은 **아무 줄도 없이 불린다**는 것이다 — 이름이 사라지는 자리에서
; 저절로 돈다 (`cpp.md` §3 #17).
((function_definition
   declarator: (function_declarator
     declarator: (destructor_name "~" @pick.1 @hole (identifier) @pick.2))
   body: (compound_statement) @pick.3) @site
 (#set! form "dtor"))

((declaration
   declarator: (function_declarator
     declarator: (destructor_name "~" @pick.1 @hole (identifier) @pick.2))) @site
 (#set! form "dtor-decl"))
