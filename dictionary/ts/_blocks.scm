; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
; 이름 노드는 `(_)` 로 둔다 — JS 의 클래스 이름은 `identifier`, TS 는 `type_identifier` 라
; 노드를 못박으면 문법 하나에서 컴파일이 거부된다.
((function_declaration name: (_) @block.name) @block.function)
((method_definition name: (_) @block.name) @block.function)
((class_declaration name: (_) @block.name) @block.function)
((lexical_declaration
   (variable_declarator
     name: (_) @block.name
     value: [(arrow_function) (function_expression)])) @block.function)
