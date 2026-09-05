; 규격이 답을 안 정한 자리. 대부분은 실행에서 일어나 정적으로 안 보인다 — 보이는 자리 셋만 짚는다.
; ① 한 식에서 같은 이름을 두 번 고치기(`x = x++`) ② 넘친 뒤에 넘침을 검사하기(`x + 1 < x` —
; 컴파일러가 통째로 지운다) ③ 길이를 안 보는 복사(`strcpy`). 나머지는 합성이 정본이다 (c.md §0.3).
((assignment_expression
   left: (identifier) @pick.2
   operator: "=" @pick.1
   right: (update_expression argument: (identifier) @pick.3 operator: ["++" "--"])) @site
 (#eq? @pick.2 @pick.3)
 (#set! form "double-modify"))

((binary_expression
   left: (binary_expression left: (identifier) @pick.2 operator: "+" right: (_))
   operator: "<" @pick.1
   right: (identifier) @pick.3) @site
 (#eq? @pick.2 @pick.3)
 (#set! form "overflow-check"))

((call_expression
   function: (identifier) @pick.1
   arguments: (argument_list . (_) @pick.2 . (_) @pick.3)) @site
 (#any-of? @pick.1 "strcpy" "strcat" "sprintf")
 (#set! form "unbounded"))
