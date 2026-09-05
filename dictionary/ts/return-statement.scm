; 값 돌려주기 — 그 자리에서 끝내고 부른 자리에 값을 건넨다.
; `return;` 처럼 값이 없는 것도 있어 둘째 자리는 선택이다.
((return_statement
   "return" @pick.1 @hole
   (_)? @pick.2) @site
 (#set! form "return"))
