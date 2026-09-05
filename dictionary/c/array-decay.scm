; 배열이 주소로 바뀌기. 함수에 배열을 넘기면 첫 칸 주소만 간다 — 함수 안의 `sizeof(a)` 는 배열
; 크기가 아니다. 정적으로 보이는 자리 둘 — 배열처럼 적은 매개변수(사실은 포인터) · 칸 수를 세는 관용구.
((parameter_declaration
   type: (_) @pick.1
   declarator: (array_declarator declarator: (identifier) @pick.2)) @site
 (#set! form "param-array"))

((binary_expression
   left: (sizeof_expression value: (parenthesized_expression (identifier) @pick.2)) @pick.3
   operator: "/" @pick.1
   right: (sizeof_expression value: (parenthesized_expression (subscript_expression)))) @site
 (#set! form "count"))
