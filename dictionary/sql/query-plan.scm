; 고른 길 읽기. 「어떻게 할지」를 안 적었으므로 읽어야만 안다.
;
; **sqlite 의 세 낱말 판(`EXPLAIN QUERY PLAN`)은 이 문법이 못 읽는다** — 뒤 두 낱말이 `(ERROR)` 가 된다
; (`docs/curriculum/sql.md` §8). 한 낱말 판만 잡히고, 그 사실을 문서가 적는다.
((statement
   (keyword_explain) @pick.1 @hole
   (select (keyword_select) @pick.2)
   (from (relation (object_reference (identifier) @pick.3)))) @site
 (#set! form "explain"))
