; 조건에 맞는 행만 남기기. 고른 열·읽는 표·조건을 한 매치에 모아
; 「이 절이 무엇을 줄이나」를 물을 수 있게 한다.
((statement
   (select (select_expression) @pick.3)
   (from
     (relation (object_reference (identifier) @pick.2))
     (where (keyword_where) @pick.1 @hole (_) @pick.4))) @site
 (#set! form "where"))
