; class 뒤의 사슬. 사슬 자체는 노드가 아니라서, 사슬을 **손으로 만지는 자리**를 잡는다 —
; `X.prototype.y` 와 `Object` 의 사슬 API 셋이다.
((member_expression
   object: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2)
   property: (property_identifier) @pick.3) @site
 (#eq? @pick.2 "prototype")
 (#set! form "prototype-member"))

((call_expression
   function: (member_expression object: (identifier) @pick.1 property: (property_identifier) @pick.2)
   arguments: (arguments . (_) @pick.3)) @site
 (#eq? @pick.1 "Object")
 (#any-of? @pick.2 "getPrototypeOf" "setPrototypeOf" "create")
 (#set! form "object-api"))
