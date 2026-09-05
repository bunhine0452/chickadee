; 볼 열 고르기. 구멍은 고르는 낱말이고 곁에 고른 목록과 읽는 표가 잡힌다.
; 앵커를 문장에 걸어 문 하나에 한 번만 잡는다 — 고른 열마다 잡으면 같은 문장이 여러 번 온다.
((statement
   (select (keyword_select) @pick.1 @hole (select_expression) @pick.2)
   (from (relation (object_reference (identifier) @pick.3)))) @site
 (#set! form "select-list"))
