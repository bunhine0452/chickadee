; 몇 줄만 가져오기. 앵커를 문장에 걸어 문 하나에 한 번 잡는다 —
; 같은 절을 0부의 `sql/row-and-set` 도 보지만 그쪽은 「순서가 없다」를, 여기는 「어느 N개냐」를 묻는다.
((statement
   (select (select_expression) @pick.4)
   (from
     (relation (object_reference (identifier) @pick.3))
     (limit (keyword_limit) @pick.1 @hole (literal) @pick.2))) @site
 (#set! form "limit"))
