; 나중에 부를 함수를 인자로 넘긴다 — 괄호를 안 붙였으니 지금 안 불린다.
; 배열 메서드 이름은 뺀다. `map`·`filter`·`forEach`·`reduce`·`then` 은 각자 개념이 있고,
; 안 빼면 이 개념의 사용처가 그쪽 사용처의 사본이 된다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments . [(arrow_function) (function_expression)] @pick.2)) @site
 (#set! form "plain"))

((call_expression
   function: (member_expression object: (_) @pick.3 property: (property_identifier) @pick.1)
   arguments: (arguments . [(arrow_function) (function_expression)] @pick.2)) @site
 (#not-any-of? @pick.1 "map" "filter" "forEach" "reduce" "reduceRight" "then" "catch" "finally" "find" "some" "every" "flatMap" "sort")
 (#set! form "method"))

; 첫 인자가 이름표이고 함수가 그 뒤 — `el.addEventListener('click', () => …)`.
((call_expression
   function: (member_expression object: (_) @pick.3 property: (property_identifier) @pick.1)
   arguments: (arguments (string) . [(arrow_function) (function_expression)] @pick.2)) @site
 (#set! form "event"))

; 이름만 넘긴 꼴 — `onClick(handleSave)`. 괄호가 없다는 것이 이 개념의 전부다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments . (identifier) @pick.2 .)) @site
 (#match? @pick.2 "^(on|handle|cb|callback|fn|done|next)")
 (#set! form "by-name"))
