; 담는 상자와 그 안의 타입. 각괄호는 **컴파일 때만** 있고 실행 때는 지워진다.
;
; `<` 는 견주기와 모양이 겹치는데 파서가 제네릭 쪽을 고른다(03 §8 ③) — 그래서 여기서
; 잡히는 자리는 `java/comparison` 에 안 걸린다. 원하는 동작이다.
;
; 빈칸은 안 낸다 — 바깥 이름이 사용처마다 다르다(`List`·`Map`·`ResponseEntity`).
((local_variable_declaration
   type: (generic_type
     (type_identifier) @pick.1
     (type_arguments . (_) @pick.2))
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "local"))

((field_declaration
   type: (generic_type
     (type_identifier) @pick.1
     (type_arguments . (_) @pick.2))
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "field"))

((method_declaration
   type: (generic_type
     (type_identifier) @pick.1
     (type_arguments . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#set! form "return"))
