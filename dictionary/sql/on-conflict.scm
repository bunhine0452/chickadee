; 없으면 넣고 있으면 고치기. 낱말이 방언마다 달라 판이 둘이다 —
; sqlite·Postgres 의 `ON CONFLICT DO …` 와 MySQL 의 `ON DUPLICATE KEY UPDATE`.
;
; **sqlite 의 `ON CONFLICT (열) DO …` 는 이 문법이 못 읽는다** — 대상 괄호가 `(ERROR)` 가 된다
; (`docs/curriculum/sql.md` §8). 그래서 괄호 없는 판만 잡히고, 그 사실을 문서가 적는다.
((insert
   (object_reference (identifier) @pick.2)
   (keyword_on) @pick.4
   (keyword_conflict) @pick.1
   (keyword_do) @pick.3) @site
 (#set! form "upsert"))

((insert
   (object_reference (identifier) @pick.2)
   (keyword_on) @pick.4
   (keyword_duplicate) @pick.1
   (keyword_key) @pick.3) @site
 (#set! form "upsert"))
