; 만들어질 때 하는 일. 돌려줄 것을 적는 자리가 **없고**(`!type`) 이름이 타입 이름과 같다 —
; 그 둘이 이 함수를 다른 함수와 가르는 표시다.
;
; 초기화 목록이 붙은 것도 이 패턴에 함께 걸린다. 목록만 따로 잡는 패턴을 두면 같은 함수가
; 두 번 세어져서 안 둔다.
((function_definition
   !type
   declarator: (function_declarator
     declarator: (identifier) @pick.1
     parameters: (parameter_list) @pick.2)
   body: (compound_statement) @pick.3) @site
 (#set! form "ctor"))

; 클래스 안에 모양만 적고 몸통은 밖에 둔 것.
((declaration
   !type
   declarator: (function_declarator
     declarator: (identifier) @pick.1
     parameters: (parameter_list) @pick.2)) @site
 (#set! form "ctor-decl"))
