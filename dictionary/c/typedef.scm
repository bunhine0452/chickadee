; 타입에 별명 붙이기. 새 타입이 아니라 이름 하나 더다 — 그런데 그 이름이 생기면 뒤 문장의 파싱이
; 바뀐다(c.md §8 ①). 함수 포인터 별명(`typedef int (*f)(int)`)은 선언자가 달라 `c/function-pointer` 의 것이다.
((type_definition
   "typedef" @pick.1 @hole
   type: (_) @pick.2
   declarator: (type_identifier) @pick.3) @site
 (#set! form "alias"))
