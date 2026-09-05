; 행 지우기. 조건 절을 요구하지 않는다 — 조건이 **없는** 문장이 이 개념의 가장 날카로운 판이다.
((statement
   (delete (keyword_delete) @pick.1 @hole)
   (from
     (keyword_from) @pick.3
     (object_reference (identifier) @pick.2))) @site
 (#set! form "delete"))
