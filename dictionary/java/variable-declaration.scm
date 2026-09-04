; 타입 붙여 이름 만들기. 자바의 요점은 **타입이 이름 앞에** 온다는 것이다.
; 빈칸은 안 낸다 — 타입 글자가 사용처마다 다르다. yaml 의 `no_hole_reason` 을 보라.
((local_variable_declaration
   type: (_) @pick.1
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "decl"))
