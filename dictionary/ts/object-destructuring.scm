; `const { a } = o` — 이름으로 꺼낸다. 배열과 달리 순서는 상관이 없다.
; 함수 매개변수 자리는 TS 가 required_parameter 를 한 겹 더 두어 구조가 갈리므로 넣지 않았다.
((variable_declarator
   name: (object_pattern . (_) @pick.1 . (_)? @pick.2) @ctx.pattern
   value: (_) @pick.3) @site
 (#set! form "declarator"))
