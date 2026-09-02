; `const [a, b] = xs` — 자리로 꺼낸다.
; 앵커(.)로 첫 두 자리에 고정한다 — 앵커가 없으면 `[a, b, c]` 가 (a,b) · (a,c) 로 두 번 잡힌다.
((variable_declarator
   name: (array_pattern . (_) @pick.1 . (_)? @pick.2) @ctx.pattern
   value: (_) @pick.3) @site
 (#set! form "declarator"))

; `[a, b] = [b, a]` — 선언 없이 자리를 맞바꾸는 자리.
((assignment_expression
   left: (array_pattern . (_) @pick.1 . (_)? @pick.2) @ctx.pattern
   right: (_) @pick.3) @site
 (#set! form "assign"))
