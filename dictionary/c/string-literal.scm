; 글자 값. 문자열은 타입이 아니라 관습이다 — `"hi"` 는 끝의 `\0` 까지 3칸이고 길이는 아무 데도
; 안 적혀 있다. 자리 셋 — 내 칸에 복사되는 배열 초기화 · 남의 칸을 가리키는 포인터 초기화 · 인자.
((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (array_declarator declarator: (identifier) @pick.2)
     value: (string_literal) @pick.1 @hole)) @site
 (#set! form "array"))

((declaration
   type: (_) @pick.3
   declarator: (init_declarator
     declarator: (pointer_declarator declarator: (identifier) @pick.2)
     value: (string_literal) @pick.1 @hole)) @site
 (#set! form "pointer"))

; 첫 인자만 — `printf` 의 서식 문자열이 그 자리다. 앵커가 없으면 인자마다 매치가 갈라진다.
((call_expression
   function: (identifier) @pick.2
   arguments: (argument_list . (string_literal) @pick.1 @hole)) @site
 (#set! form "argument"))
