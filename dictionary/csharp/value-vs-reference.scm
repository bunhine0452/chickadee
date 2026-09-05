; 복사되는 값과 가리키는 값. 같은 `=` 가 두 일을 하는데, **어느 쪽인지를 이름이 아니라
; 이 선언 낱말이 정한다.** 그래서 짚는 자리가 대입이 아니라 타입 선언이다.
((struct_declaration
   "struct" @pick.1 @hole
   name: (identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "value-type"))

((class_declaration
   "class" @pick.1 @hole
   name: (identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "reference-type"))
