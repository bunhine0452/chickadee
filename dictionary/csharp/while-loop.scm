; 조건이 참인 동안 되풀이. 조건이 `bool` 이어야 해서 `while (n)` 이 안 되고, 조건을 뒤에서
; 재는 `do…while` 이 따로 있다 — 그 둘이 한 개념이다.
((while_statement
   "while" @pick.1 @hole
   condition: (_) @pick.2
   body: (_) @pick.3) @site
 (#set! form "while"))

((do_statement
   "do" @pick.1
   body: (_) @pick.3
   condition: (_) @pick.2) @site
 (#set! form "do-while"))
