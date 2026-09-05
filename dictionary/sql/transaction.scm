; 여러 문장을 한 덩어리로. 여는 낱말·안의 문장·닫는 낱말을 함께 잡는다 —
; 닫는 낱말이 무엇이냐가 그 덩어리의 결말이다.
;
; **sqlite 의 `SAVEPOINT` 와 MySQL 의 `START TRANSACTION` 은 이 문법이 못 읽는다**
; (`docs/curriculum/sql.md` §8). `BEGIN`(과 `BEGIN TRANSACTION`)만 잡힌다.
((transaction
   (keyword_begin) @pick.1 @hole
   (statement) @pick.2
   [(keyword_commit) (keyword_rollback)] @pick.3) @site
 (#set! form "transaction"))
