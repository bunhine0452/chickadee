; 블록을 벗어나면 정리하기. **낱말 하나가 두 가지다** — 파일 맨 위의 `using` 은 이름
; 가져오기이고, 문 자리의 `using` 은 정리다. 여기서 잡는 것은 뒤의 것뿐이다.
((using_statement
   "using" @pick.1 @hole
   (variable_declaration
     type: (_) @pick.2
     (variable_declarator name: (identifier) @pick.3))
   body: (_) @pick.4) @site
 (#set! form "block"))

; 이름을 안 붙이는 꼴 — `using (conn) { … }`.
((using_statement
   "using" @pick.1 @hole
   (identifier) @pick.2
   body: (_) @pick.4) @site
 (#set! form "expression"))
