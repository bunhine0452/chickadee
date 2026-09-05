; 하나씩 훑기. 요점은 **참조를 안 붙이면 매 바퀴 항목이 복사된다**는 것이고,
; 안에서 고쳐도 원본이 안 바뀐다는 것이다 (`cpp.md` §3 #12).
((for_range_loop
   type: (_) @pick.3
   declarator: (_) @pick.1
   ":" @hole
   right: (_) @pick.2
   body: (_)) @site
 (#set! form "range"))
