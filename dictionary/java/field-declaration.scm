; 클래스가 지니는 값. 지역 변수와 **문법이 똑같고 노드 이름만 다르다** — 문맥이 가른다.
; 그래서 규칙(안 적어도 기본값을 받는다)이 노드로 안전하게 갈린다.
;
; 클래스 밖에 적힌 필드는 `local_variable_declaration` 으로 잡힌다(압축 소스 파일, 03 §8 ④).
; 그 자리는 `java/variable-declaration` 의 것이다.
((field_declaration
   (modifiers)? @pick.3
   type: (_) @pick.1
   declarator: (variable_declarator name: (identifier) @pick.2)) @site
 (#set! form "field"))
