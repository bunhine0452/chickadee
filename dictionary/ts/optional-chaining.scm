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

; TS 문법에서 호출의 `?.` 는 `optional_chain` 노드가 아니라 익명 토큰이다 (`a.b?.()`).
; JS 문법은 같은 자리를 `optional_chain` 으로 둔다 — 구조가 다르므로 파일을 나눈다 (03 §3.2).
((call_expression
   function: (_) @pick.1
   "?." @pick.2
   arguments: (_) @pick.3) @site
 (#set! form "call"))

; 맥락 패턴(@site 없음) — `??` 의 우변을 그 안의 `?.` 사용처에 ctx.fallback 으로 붙인다.
(binary_expression
  left: (_ (optional_chain)) operator: "??" right: (_) @ctx.fallback)
