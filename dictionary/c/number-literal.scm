; 적는 모양이 타입을 정한다 — `1`·`1.0`·`1u`·`1L`·`0x1F`. `7/2` 가 3 인 이유가 여기서 시작한다.
; 리터럴 하나가 값의 자리에 그대로 온 줄만 잡는다. 셈 안의 리터럴은 `c/arithmetic` 의 것이다.
; 정규식에 역슬래시를 안 쓴다 — 소수점은 문자 클래스 `[.]` 로 적는다.
((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.1 @hole)) @site
 (#match? @pick.1 "^[0-9]+$")
 (#set! form "whole"))

((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.1 @hole)) @site
 (#match? @pick.1 "^[0-9]*[.][0-9]+([eE][-+]?[0-9]+)?[fFlL]?$")
 (#set! form "fraction"))

((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.1 @hole)) @site
 (#match? @pick.1 "^[0-9]+[uUlL]+$")
 (#set! form "suffix"))

((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (number_literal) @pick.1 @hole)) @site
 (#match? @pick.1 "^0[xX][0-9a-fA-F]+[uUlL]*$")
 (#set! form "hex"))
