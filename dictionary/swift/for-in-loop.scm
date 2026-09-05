; 하나씩 훑기. Swift 3.0 에서 `for (i = 0; …)` 가 삭제돼 이 꼴이 반복의 자리를 전부 가져갔다.
((for_statement
   "for" @pick.1 @hole
   item: (pattern (simple_identifier) @pick.2)
   collection: (_) @pick.3) @site
 (#set! form "forin"))
