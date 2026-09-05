; 함수를 정의하는 줄. 구멍은 **돌려줄 것의 타입**이다.
;
; **선언은 안 잡는다** — `void f(int);` 는 몸통이 없고, 같은 함수의 다른 자리다.
; 헤더와 소스가 있는 리포에서 둘 다 잡으면 사용처가 두 배로 센다 (`cpp.md` §8).
((function_definition
   type: (_) @pick.1 @hole
   declarator: (function_declarator
     declarator: (identifier) @pick.2
     parameters: (parameter_list) @pick.3)
   body: (compound_statement)) @site
 (#set! form "free"))

; 클래스 안에 몸통까지 적은 것.
((function_definition
   type: (_) @pick.1 @hole
   declarator: (function_declarator
     declarator: (field_identifier) @pick.2
     parameters: (parameter_list) @pick.3)
   body: (compound_statement)) @site
 (#set! form "inline-method"))

; 클래스 밖에서 몸통을 적은 것 — `void Widget::draw() { … }`.
((function_definition
   type: (_) @pick.1 @hole
   declarator: (function_declarator
     declarator: (qualified_identifier name: (identifier) @pick.2)
     parameters: (parameter_list) @pick.3)
   body: (compound_statement)) @site
 (#set! form "out-of-class"))
