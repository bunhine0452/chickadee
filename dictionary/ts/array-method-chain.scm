; 두 단 이상 체인 — 앞 단계가 돌려준 배열에 다음 단계가 붙는다.
((call_expression
   function: (member_expression
     object: (call_expression
       function: (member_expression object: (_) @pick.3 property: (property_identifier) @pick.1))
     property: (property_identifier) @pick.2)) @site
 (#any-of? @pick.1 "map" "filter" "flatMap" "sort" "slice")
 (#any-of? @pick.2 "map" "filter" "reduce" "find" "some" "every" "join")
 (#set! form "chain"))
