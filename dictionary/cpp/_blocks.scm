; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; **선언은 안 잡는다.** `void f(int);`(헤더)와 `void f(int) { … }`(소스)는 같은 함수의 두 자리라
; 둘 다 잡으면 헤더가 있는 리포에서 블록이 두 배로 센다 (`cpp.md` §8 「시스템 쿼리와 `.h`」).
; `function_definition` 만 잡으므로 몸통이 있는 쪽 하나만 남는다.
;
; 이름이 나오는 자리가 넷이다 — 자유 함수는 `identifier`, 클래스 안 인라인 메서드는
; `field_identifier`, 클래스 밖 정의(`Widget::draw`)는 `qualified_identifier`, 소멸자는
; `destructor_name`. 넷을 한 패턴으로 못 쓴다.

((function_definition
   declarator: (function_declarator declarator: (identifier) @block.name)) @block.function
 (#set! form "function"))

((function_definition
   declarator: (function_declarator declarator: (field_identifier) @block.name)) @block.function
 (#set! form "method"))

((function_definition
   declarator: (function_declarator
     declarator: (qualified_identifier name: (identifier) @block.name))) @block.function
 (#set! form "method"))

((function_definition
   declarator: (function_declarator
     declarator: (qualified_identifier name: (field_identifier) @block.name))) @block.function
 (#set! form "method"))

((function_definition
   declarator: (function_declarator declarator: (destructor_name) @block.name)) @block.function
 (#set! form "method"))

; 참조·포인터를 돌려주는 함수는 선언자가 한 겹 더 싸여 있다 — `std::string& name() { … }`.
((function_definition
   declarator: (reference_declarator
     (function_declarator declarator: (_) @block.name))) @block.function
 (#set! form "function"))

((function_definition
   declarator: (pointer_declarator
     (function_declarator declarator: (_) @block.name))) @block.function
 (#set! form "function"))

((class_specifier name: (type_identifier) @block.name) @block.function
 (#set! form "class"))

((struct_specifier name: (type_identifier) @block.name) @block.function
 (#set! form "class"))

((namespace_definition name: (namespace_identifier) @block.name) @block.function
 (#set! form "namespace"))
