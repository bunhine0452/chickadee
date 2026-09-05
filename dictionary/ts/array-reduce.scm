; 접어서 하나로 — 인자가 둘이다. 앞이 누적 함수, 뒤가 초깃값이고, 초깃값이 없으면
; 첫 항목이 그 자리를 맡는다. 그 갈림이 이 개념의 전부라 두 인자를 다 짚는다.
((call_expression
   function: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2 @hole)
   arguments: (arguments . (_) @pick.3)) @site
 (#any-of? @pick.2 "reduce" "reduceRight")
 (#set! form "fold"))
