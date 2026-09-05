; push — 원본을 직접 늘리는 자리. 인자가 여럿이어도 사용처는 하나여야 하므로 첫 인자에 앵커를 건다.
((call_expression
   function: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2 @hole)
   arguments: (arguments . (_) @pick.3)) @site
 (#eq? @pick.2 "push")
 (#set! form "push"))
