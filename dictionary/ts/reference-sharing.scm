; `b = a` 는 **가리키는 곳만** 복사한다. 상자가 새로 생기지 않으므로 한쪽에서 고치면
; 다른 쪽에서 보인다. 값이 이름 하나뿐인 선언만 잡는다 — 거기서 별칭이 만들어진다.
((lexical_declaration
   ["const" "let"] @pick.1
   (variable_declarator
     name: (identifier) @pick.2
     value: (identifier) @pick.3)) @site
 (#set! form "alias"))
