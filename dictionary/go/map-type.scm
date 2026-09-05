; 열쇠로 값 찾기. 선언 · 리터럴 · **있었는지 묻는 두 값 받기**(`v, ok := m[k]`) 셋을 잡는다.
; 마지막이 「없는 열쇠는 오류가 아니라 제로 값」이 실제로 보이는 자리다.
;
; 세 형태에서 `@pick.2` 는 언제나 **묶음의 이름**, `@pick.3` 은 **열쇠 자리**다 — 문항이
; 형태마다 다른 것을 가리키면 같은 물음이 안 된다.
((var_spec
   name: (identifier) @pick.2
   type: (map_type key: (_) @pick.3 value: (_) @pick.4) @hole) @site
 (#set! form "decl"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   right: (expression_list . (composite_literal
     type: (map_type key: (_) @pick.3 value: (_) @pick.4) @hole
     body: (literal_value) @pick.5) .)) @site
 (#set! form "lit"))

((short_var_declaration
   left: (expression_list . (identifier) @pick.5 . (identifier) @pick.6 .)
   right: (expression_list . (index_expression
     operand: (identifier) @pick.2
     index: (_) @pick.3) .)) @site
 (#set! form "commaok"))
