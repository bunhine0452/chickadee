; 다시 넣지 못하는 이름. 못 바꾸는 것은 **이름이 가리키는 것**이고 그 안의 내용이 아니다 —
; `final List<String> xs` 여도 `xs.add(…)` 는 된다(§10 오개념 4).
;
; `modifiers` 가 평평해서 익명 노드로 짚는다(03 §8 ①). 필드와 지역 변수 둘 다 잡는다 —
; 표본 리포에서는 필드 쪽이 거의 전부다(생성자 주입).
((field_declaration
   (modifiers "final" @pick.1 @hole)
   type: (_) @pick.2
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "field"))

((local_variable_declaration
   (modifiers "final" @pick.1 @hole)
   type: (_) @pick.2
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "local"))
