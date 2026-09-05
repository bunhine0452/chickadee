; `const` 선언 — 이름 하나에 값을 묶는 자리다 (03 §3.2).
((lexical_declaration
   "const" @pick.1 @hole
   (variable_declarator
     name: (_) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "const"))

; `let` 은 값 없이도 선언된다 — `let cursor;` 처럼.
((lexical_declaration
   "let" @pick.1 @hole
   (variable_declarator
     name: (_) @pick.2
     value: (_)? @pick.3)) @site
 (#set! form "let"))
