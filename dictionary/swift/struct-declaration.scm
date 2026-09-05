; 값으로 도는 묶음. `struct` 는 넘길 때 복사되고 `class` 는 같은 상자를 가리킨다 —
; 낱말 하나가 「고치면 저쪽도 바뀌나」를 통째로 뒤집는다. 트리에서는 같은 노드라
; `declaration_kind` 로 못을 박는다 (swift.md §8 함정 ①).
((class_declaration
   declaration_kind: "struct" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (class_body) @pick.3) @site
 (#set! form "struct"))

((class_declaration
   declaration_kind: "class" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (class_body) @pick.3) @site
 (#set! form "class"))
