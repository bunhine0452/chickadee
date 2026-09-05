; 함수 정의. 짚는 자리가 **돌려줄 타입**이고 그것이 이름 앞에 온다는 것이 요점이다 — 안 돌려주면
; `void` 라고 적어야 한다. 빈칸은 안 낸다(타입이 사용처마다 다르다 — yaml 의 `no_hole_reason`).
; 포인터를 돌려주는 함수는 선언자가 한 겹 더 싸여 있어 따로 잡는다.
((function_definition
   type: (_) @pick.1
   declarator: (function_declarator
     declarator: (identifier) @pick.2
     parameters: (parameter_list) @pick.3)
   body: (compound_statement) @pick.4) @site
 (#set! form "fn"))

((function_definition
   type: (_) @pick.1
   declarator: (pointer_declarator
     declarator: (function_declarator
       declarator: (identifier) @pick.2
       parameters: (parameter_list) @pick.3))
   body: (compound_statement) @pick.4) @site
 (#set! form "fn-ptr"))
