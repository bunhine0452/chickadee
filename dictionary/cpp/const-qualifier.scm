; 못 바꾼다는 약속. 「상수」가 아니라 **「이 이름으로는 못 만진다」**이고, 남이 원본을
; 바꾸는 것은 못 막는다 (`cpp.md` §3 #14).
((parameter_declaration
   (type_qualifier) @pick.1 @hole
   type: (_) @pick.3
   declarator: (_) @pick.2) @site
 (#eq? @pick.1 "const")
 (#set! form "constparam"))

((declaration
   (type_qualifier) @pick.1 @hole
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_))) @site
 (#eq? @pick.1 "const")
 (#set! form "constvar"))

; 멤버 함수 뒤에 붙은 것 — 「이 함수는 자기 안을 안 바꾼다」는 약속이다.
((function_definition
   type: (_) @pick.3
   declarator: (function_declarator
     declarator: (field_identifier) @pick.2
     (type_qualifier) @pick.1 @hole)) @site
 (#eq? @pick.1 "const")
 (#set! form "constmethod"))
