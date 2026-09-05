; 값 돌려주기. 안 적으면 조용히 쓰레기가 간다 — 파이썬은 조용히 `None` 이 간다. `main` 의 값은
; 종료 코드라 셸이 읽는다. 값 없는 `return;` 은 짚을 것이 낱말 하나뿐이라 안 잡는다.
((return_statement
   "return" @pick.1 @hole
   (_) @pick.2
   ";" @pick.3) @site
 (#set! form "return"))
