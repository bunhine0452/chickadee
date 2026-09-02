; 배열 리터럴 — 대괄호 안에 값을 순서대로 늘어놓는다.
((array) @site @pick.1
 (#set! form "literal"))

; 길이 읽기 — `xs.length`.
((member_expression
   object: (_) @pick.1
   property: (property_identifier) @pick.2) @site
 (#eq? @pick.2 "length")
 (#set! form "length"))

; 자리 번호로 읽기 — `xs[0]`. 첫 자리가 0 이다.
((subscript_expression
   object: (_) @pick.1
   index: (_) @pick.2) @site
 (#set! form "index"))
