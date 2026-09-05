; 「같다」를 직접 정하기. 둘은 한 쌍이라 한 개념이다 — 하나만 고치면 해시로 찾는 상자가
; 방금 넣은 것을 못 찾는다.
;
; 이름으로 가른다. 노드로는 다른 메서드와 구별되지 않는다.
((method_declaration
   name: (identifier) @pick.1 @hole
   parameters: (formal_parameters) @pick.2) @site
 (#eq? @pick.1 "equals")
 (#set! form "equals"))

((method_declaration
   name: (identifier) @pick.1
   body: (block) @pick.3) @site
 (#eq? @pick.1 "hashCode")
 (#set! form "hashCode"))
