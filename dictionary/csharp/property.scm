; 필드처럼 보이는 메서드 둘. 자동 프로퍼티는 **이름 없는 필드**를 하나 만들고, 그 사실이
; `x.N++` 이 원자적이지 않은 이유다.
;
; 빈칸은 안 낸다 — 구멍이 접근자 목록이라 한 토큰이 아니다. yaml 의 `no_hole_reason`.
((property_declaration
   type: (_) @pick.1
   name: (identifier) @pick.2
   accessors: (accessor_list) @pick.3) @site
 (#set! form "auto"))

((property_declaration
   type: (_) @pick.1
   name: (identifier) @pick.2
   value: (arrow_expression_clause) @pick.4) @site
 (#set! form "expression"))
