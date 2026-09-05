; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; 함수 정의의 이름은 선언자 **안쪽**에 있다 — `int f(void)` 는 `function_declarator`,
; `char *f(void)` 는 `pointer_declarator` 가 그것을 한 겹 더 싼다. 둘 다 잡는다.
((function_definition
   declarator: (function_declarator declarator: (identifier) @block.name)) @block.function
 (#set! form "function"))

((function_definition
   declarator: (pointer_declarator
     declarator: (function_declarator declarator: (identifier) @block.name))) @block.function
 (#set! form "function"))

; 몸통이 있는 구조체 정의. `struct P p;` 처럼 이름만 쓰는 자리는 블록이 아니다.
((struct_specifier name: (type_identifier) @block.name body: (field_declaration_list)) @block.function
 (#set! form "struct"))
