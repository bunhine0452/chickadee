; 있기만 하면 되는 조건. 안쪽이 무엇을 고르는지는 안 본다 — 그래서 고른 목록도 같이 잡아
; 「이 자리를 바꿔도 답이 같다」를 물을 수 있게 한다.
((exists
   (keyword_exists) @pick.1 @hole
   (subquery
     (select (select_expression) @pick.2)
     (from (relation (object_reference (identifier) @pick.3))))) @site
 (#set! form "exists"))
