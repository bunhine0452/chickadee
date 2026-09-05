; 하나씩 훑기. 도는 동안 원본을 고치면 `InvalidOperationException` 으로 **터진다** —
; 조용히 이상해지지 않는다.
((foreach_statement
   "foreach" @pick.1 @hole
   type: (_) @pick.4
   left: (_) @pick.2
   right: (_) @pick.3
   body: (_) @pick.5) @site
 (#set! form "foreach"))
