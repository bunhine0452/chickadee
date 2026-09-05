; 누가 볼 수 있나. `modifiers` 가 평평해 익명 노드로 짚는다(03 §8 ①) — 형제 앵커는 안 쓴다.
; 빈칸은 안 낸다: 정답이 `public` 이냐 `private` 이냐로 사용처마다 갈린다. yaml 의
; `no_hole_reason` 을 보라.
((field_declaration
   (modifiers ["public" "protected" "private"] @pick.1)
   type: (_) @pick.2
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "field"))

((method_declaration
   (modifiers ["public" "protected" "private"] @pick.1)
   type: (_) @pick.2
   name: (identifier) @pick.3) @site
 (#set! form "method"))

((class_declaration
   (modifiers ["public" "protected" "private"] @pick.1)
   "class" @pick.2
   name: (identifier) @pick.3) @site
 (#set! form "class"))
