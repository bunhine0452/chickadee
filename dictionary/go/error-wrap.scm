; 실패를 감싸 올려보내기. `%w` 로 감싼 것만 `errors.Is`·`errors.As` 가 벗겨 낸다.
; 구멍은 **서식 문자열**이다 — `%w` 와 `%v` 중 무엇을 적었나가 판의 전부다.
((call_expression
   function: (selector_expression
     operand: (identifier) @pick.4
     field: (field_identifier) @pick.2)
   arguments: (argument_list . (interpreted_string_literal) @pick.1 @hole . (_) @pick.3)) @site
 (#eq? @pick.2 "Errorf")
 (#set! form "wrap"))
