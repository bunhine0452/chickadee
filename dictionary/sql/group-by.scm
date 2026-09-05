; 같은 값끼리 묶기. 구멍은 `GROUP` 이고 같은 자리에 올 수 있는 다른 낱말이 `ORDER` 다.
((from
   (relation (object_reference (identifier) @pick.3))
   (group_by
     (keyword_group) @pick.1 @hole
     (keyword_by) @pick.4
     (field (identifier) @pick.2))) @site
 (#set! form "group-by"))
