; 줄 세우기. 구멍은 `ORDER` 이고 같은 자리에 올 수 있는 다른 낱말이 `GROUP` 이라
; 빈칸 하나가 두 절을 가른다.
((from
   (relation (object_reference (identifier) @pick.3))
   (order_by
     (keyword_order) @pick.1 @hole
     (keyword_by) @pick.4
     (order_target (field (identifier) @pick.2)))) @site
 (#set! form "order-by"))
