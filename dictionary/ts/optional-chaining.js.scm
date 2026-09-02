((member_expression
   object: (_) @pick.1
   optional_chain: (optional_chain) @pick.2
   property: (_) @pick.3) @site
 (#set! form "member"))

((subscript_expression
   object: (_) @pick.1
   optional_chain: (optional_chain) @pick.2
   index: (_) @pick.3) @site
 (#set! form "subscript"))

; JS 문법은 호출의 `?.` 도 `optional_chain` 노드다 — TS 판과 다른 유일한 패턴이다.
((call_expression
   function: (_) @pick.1
   (optional_chain) @pick.2
   arguments: (_) @pick.3) @site
 (#set! form "call"))

; 맥락 패턴(@site 없음) — `??` 의 우변을 그 안의 `?.` 사용처에 ctx.fallback 으로 붙인다.
(binary_expression
  left: (_ (optional_chain)) operator: "??" right: (_) @ctx.fallback)
