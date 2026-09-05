; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; Go 는 함수와 메서드가 **다른 노드**이고 이름 필드의 타입도 다르다 — 함수는 `identifier`,
; 메서드는 `field_identifier` 다(`go.md` §8). 한 패턴으로 못 쓴다.
((function_declaration name: (identifier) @block.name) @block.function
 (#set! form "func"))

((method_declaration name: (field_identifier) @block.name) @block.function
 (#set! form "method"))
