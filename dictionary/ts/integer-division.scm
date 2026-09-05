; `/` 는 늘 소수를 낸다. 버림은 `Math.floor`(아래)와 `Math.trunc`(0 쪽)로 **갈린다** —
; 음수에서 두 답이 달라지고, 그 갈림이 이 개념의 전부다.
((call_expression
   function: (member_expression
               object: (identifier) @pick.1
               property: (property_identifier) @pick.2)
   arguments: (arguments . (_) @pick.3)) @site
 (#eq? @pick.1 "Math")
 (#match? @pick.2 "^(floor|trunc|ceil|round)$")
 (#set! form "truncate"))
