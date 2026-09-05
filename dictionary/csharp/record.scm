; 값으로 견주는 타입. 같은 `class` 였다면 참조를 묻던 `==` 가 여기서는 내용을 묻는다.
; 위치 레코드(괄호로 받는 꼴)와 몸통을 적는 꼴이 한 개념이다.
((record_declaration
   "record" @pick.1 @hole
   name: (identifier) @pick.2
   (parameter_list) @pick.3) @site
 (#set! form "positional"))

((record_declaration
   "record" @pick.1 @hole
   name: (identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "body"))

((with_expression
   (_) @pick.2
   "with" @pick.1
   (with_initializer) @pick.3) @site
 (#set! form "with"))
