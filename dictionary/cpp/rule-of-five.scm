; 다섯을 함께 정하기. 하나를 적으면 나머지도 적어야 한다 — 안 적으면 컴파일러가
; **얕은 복사본**을 대신 만든다 (`cpp.md` §4 #29 · §9 #5).
;
; 코드에 드러나는 자리는 「다섯 중 하나를 못 박은 곳」이다.
((function_definition
   declarator: (function_declarator
     declarator: (_) @pick.2
     parameters: (parameter_list) @pick.3)
   (default_method_clause "default" @pick.1 @hole)) @site
 (#set! form "defaulted"))

((function_definition
   declarator: (function_declarator
     declarator: (_) @pick.2
     parameters: (parameter_list) @pick.3)
   (delete_method_clause "delete" @pick.1 @hole)) @site
 (#set! form "deleted"))

; 복사·이동 생성자 선언 — 받는 것이 **자기 타입의 참조**인 것이 표시다.
((declaration
   !type
   declarator: (function_declarator
     declarator: (identifier) @pick.2
     parameters: (parameter_list
       (parameter_declaration
         type: (type_identifier) @pick.3
         declarator: (reference_declarator) @pick.1)))) @site
 (#eq? @pick.2 @pick.3)
 (#set! form "copy-or-move"))
