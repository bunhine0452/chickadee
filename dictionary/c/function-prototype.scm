; 먼저 알리고 나중에 채우기. 같은 함수가 두 번 적힌다 — 선언만 있고 정의가 없으면 컴파일은 통과하고
; **링크에서** 터진다. 정의(`function_definition`)와 노드가 다르다. 포인터를 돌려주는 알림은 한 겹 더 싸여 있다.
((declaration
   type: (_) @pick.1
   declarator: (function_declarator
     declarator: (identifier) @pick.2
     parameters: (parameter_list) @pick.3)) @site
 (#set! form "proto"))

((declaration
   type: (_) @pick.1
   declarator: (pointer_declarator
     declarator: (function_declarator
       declarator: (identifier) @pick.2
       parameters: (parameter_list) @pick.3))) @site
 (#set! form "proto-ptr"))
