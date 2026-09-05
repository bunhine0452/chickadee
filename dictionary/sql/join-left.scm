; 짝이 없어도 왼쪽은 남기기. 구멍은 `LEFT` 하나다 — 그 낱말이 있고 없고가 결과의 행 수를 가른다.
((from
   (relation (object_reference (identifier) @pick.2))
   (join
     (keyword_left) @pick.1 @hole
     (keyword_join) @pick.4
     (relation (object_reference (identifier) @pick.3))
     (keyword_on))) @site
 (#set! form "left-join"))
