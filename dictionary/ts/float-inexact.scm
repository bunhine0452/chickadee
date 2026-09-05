; `0.1 + 0.2 !== 0.3` — 2진수로 `0.1` 을 정확히 못 적는다. 그 사실이 코드에 드러나는 자리는
; **자릿수를 잘라 보이는 곳**과 **엡실론으로 견주는 곳** 둘이다.
((call_expression
   function: (member_expression
               object: (_) @pick.1
               property: (property_identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#match? @pick.2 "^(toFixed|toPrecision)$")
 (#set! form "fixed"))

((member_expression
   object: (identifier) @pick.1
   "." @pick.3
   property: (property_identifier) @pick.2) @site
 (#eq? @pick.1 "Number")
 (#eq? @pick.2 "EPSILON")
 (#set! form "epsilon"))
