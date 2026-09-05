; 참·거짓 값. 요점은 참이 하나가 아니라는 것이다 — 정수가 이 자리에 그냥 들어오고,
; 반대로 참·거짓이 정수 자리에 그냥 들어간다.
((declaration
   type: (primitive_type) @pick.1
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: [(true) (false)] @pick.3 @hole)) @site
 (#eq? @pick.1 "bool")
 (#set! form "booldecl"))

; 참·거짓 자리에 수가 온 곳. 컴파일이 통과한다는 것이 이 판의 절반이다.
((declaration
   type: (primitive_type) @pick.1
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.3)) @site
 (#eq? @pick.1 "bool")
 (#set! form "boolint"))

; 돌려주는 자리 — 참·거짓을 돌려준다고 적어 놓고 수를 돌려줘도 통과한다.
((return_statement [(true) (false)] @pick.3 @hole) @site
 (#set! form "boolreturn"))
