; 식 하나가 행마다 한 번. 조건을 한 번 적었는데 행 수만큼 평가된다 —
; 그래서 반복문을 적을 자리가 없다. 읽는 문장과 고치는 문장 둘 다 잡는다.
((from
   (relation (object_reference (identifier) @pick.3))
   (where (keyword_where) @pick.1 @hole (_) @pick.2)) @site
 (#set! form "per-row"))

((update
   (relation (object_reference (identifier) @pick.3))
   (where (keyword_where) @pick.1 @hole (_) @pick.2)) @site
 (#set! form "per-row"))
