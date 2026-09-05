; 있는 행의 값 바꾸기. 구멍은 `SET` 이고 곁에 고칠 표와 고칠 열이 잡힌다.
; 조건 절은 안 잡는다 — 있을 때와 없을 때가 둘 다 이 개념의 판이라서다.
((update
   (keyword_update) @pick.4
   (relation (object_reference (identifier) @pick.3))
   (keyword_set) @pick.1 @hole
   (assignment (field (identifier) @pick.2))) @site
 (#set! form "update-set"))
