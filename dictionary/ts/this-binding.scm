; `this` 는 정의한 자리가 아니라 부른 자리가 정한다. 정적으로 보이는 자리는 둘이다 —
; `this` 를 실제로 쓰는 곳과, 그것을 손으로 다시 묶는 세 메서드다.
((member_expression
   object: (this) @pick.1
   property: (property_identifier) @pick.2) @site @pick.3
 (#set! form "this-member"))

((call_expression
   function: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2)
   arguments: (arguments . (_) @pick.3)) @site
 (#any-of? @pick.2 "bind" "call" "apply")
 (#set! form "rebind"))
