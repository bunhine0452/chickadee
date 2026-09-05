; 글자 묶음 값. 요점은 **값이라 대입이 복사**라는 것이다 — C 의 `char*`(주소)와 정반대고,
; 견주기도 내용을 본다.
((declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (type_identifier) @pick.1 @hole)
   declarator: (init_declarator
     declarator: (identifier) @pick.3
     value: (_))) @site
 (#eq? @pick.1 "string")
 (#set! form "strdecl"))

((declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (type_identifier) @pick.1 @hole)
   declarator: (identifier) @pick.3) @site
 (#eq? @pick.1 "string")
 (#set! form "strbare"))

; 매개변수로 받는 자리 — 여기가 복사냐 아니냐가 갈리는 실제 자리다.
((parameter_declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (type_identifier) @pick.1 @hole)
   declarator: (_) @pick.3) @site
 (#eq? @pick.1 "string")
 (#set! form "strparam"))
