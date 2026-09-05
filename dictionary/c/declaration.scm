; 타입 이름이 「만드는 낱말」이다 — `int x = 0;` 은 만들고 `x = 0;` 은 옮긴다.
; 포인터·배열·함수 선언자는 여기 안 든다. 그 자리는 각각 `c/pointer-declaration`·
; `c/array-declaration`·`c/function-prototype` 의 것이다.
((declaration
   type: (_) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "init"))

; 값 없이 만든 이름. 지역이면 상자 안이 쓰레기다 — 0 이 아니다 (c.md §9 #2).
((declaration
   type: (_) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#set! form "bare"))
