; 새 행 넣기. 구멍은 넣는 낱말이고 곁에 넣을 표와 값 목록의 낱말이 잡힌다.
; 열 목록은 안 잡는다 — 열마다 한 번씩 매치가 나서 같은 문장이 여러 번 온다.
((insert
   (keyword_insert) @pick.1 @hole
   (keyword_into) @pick.4
   (object_reference (identifier) @pick.2)
   (keyword_values) @pick.3) @site
 (#set! form "insert"))
