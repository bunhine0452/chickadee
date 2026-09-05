; 하나씩 훑기. 값까지 받는 것과 열쇠·자리만 받는 것을 갈라 잡는다 —
; 값 변수가 **복사본**이라는 사실은 앞의 것에서만 물을 수 있다.
((for_statement
   "for" @pick.1
   (range_clause
     left: (expression_list . (identifier) @pick.2 . (identifier) @pick.3 .)
     "range" @pick.4 @hole
     right: (_) @pick.5)
   body: (block)) @site
 (#set! form "kv"))

((for_statement
   "for" @pick.1
   (range_clause
     left: (expression_list . (identifier) @pick.2 .)
     "range" @pick.4 @hole
     right: (_) @pick.5)
   body: (block)) @site
 (#set! form "one"))
