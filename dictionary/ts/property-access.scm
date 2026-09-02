; `a.b` — 점 하나로 값 안의 이름을 꺼낸다.
; `a?.b` 는 점이 아니라 `optional_chain` 노드라 여기 걸리지 않는다 (`ts/optional-chaining`).
((member_expression
   object: (_) @pick.1
   "." @pick.2
   property: (property_identifier) @pick.3) @site
 (#set! form "member"))
