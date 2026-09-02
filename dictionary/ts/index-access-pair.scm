; `const a = xs[0];` 와 `const b = xs[1];` 이 나란히 있는 자리 — 배열 구조분해가 대신할 수 있다.
; 사용처는 첫 줄 하나이고 지목 캡처는 전부 그 안에 있다. 뒷줄은 맥락 캡처로만 본다.
; #eq? 로 두 줄이 같은 배열을 꺼낼 때만 잡는다.
((lexical_declaration
   (variable_declarator
     name: (_) @pick.1
     value: (subscript_expression object: (_) @pick.2 index: (number) @pick.3))) @site
 .
 (lexical_declaration
   (variable_declarator
     name: (_) @ctx.next
     value: (subscript_expression object: (_) @ctx.same index: (number) @ctx.index)))
 (#eq? @pick.2 @ctx.same)
 (#set! form "pair"))
