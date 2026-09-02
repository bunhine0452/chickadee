; .then 체인 — async/await 와 같은 일을 하는 다른 표기 (`_lang.yaml` 의 alternatives).
((call_expression
   function: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2)
   arguments: (arguments . (_) @pick.3)) @site
 (#eq? @pick.2 "then")
 (#set! form "then"))

((call_expression
   function: (member_expression object: (_) @pick.1 property: (property_identifier) @pick.2)
   arguments: (arguments . (_) @pick.3)) @site
 (#any-of? @pick.2 "catch" "finally")
 (#set! form "tail"))
