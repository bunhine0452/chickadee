; 값을 돌려주는 줄. 구멍은 낱말이고, 요점은 **돌려줄 것이 있다고 적고 안 돌려주면
; 무슨 일이 날지 정해져 있지 않다**는 것이다 (`cpp.md` §2 8번).
((return_statement
   "return" @pick.1 @hole
   (_) @pick.2) @site
 (#set! form "value"))

; 값 없이 나가는 줄 — 돌려줄 것이 없다고 적은 함수에서만 맞다.
((return_statement "return" @pick.1 @hole) @site
 (#match? @site "^return\\s*;$")
 (#set! form "bare"))
