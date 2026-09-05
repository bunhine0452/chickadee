; 적는 순서와 도는 순서가 다르다. 세 절의 낱말을 한 매치에 모아 잡아야
; 「이 셋 중 먼저 도는 것」을 물을 수 있다.
((statement
   (select (keyword_select) @pick.1 (select_expression) @pick.4)
   (from
     (keyword_from) @pick.2
     (relation (object_reference (identifier)))
     (where (keyword_where) @pick.3))) @site
 (#set! form "clause-order"))
