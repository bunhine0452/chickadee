; 여러 행을 한 값으로 접기. 부르는 꼴은 보통 함수와 같아서 **이름 목록**으로만 갈린다 —
; 노드로는 접는 함수와 안 접는 함수가 구별되지 않는다.
((invocation
   (object_reference (identifier) @pick.1)
   "(" @pick.3 . (term) @pick.2) @site
 (#match? @pick.1 "^(COUNT|SUM|AVG|MIN|MAX|TOTAL|count|sum|avg|min|max|total|Count|Sum|Avg|Min|Max)$")
 (#set! form "aggregate"))
