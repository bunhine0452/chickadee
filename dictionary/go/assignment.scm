; 이름에 값 넣기와 제로 값. 두 자리다 — `var` 로 **타입만 적은 선언**(그 순간 제로 값이
; 들어간다)과, 이미 있는 이름에 다시 넣는 `=`.
;
; `:=` 는 여기 안 든다. 그 자리는 `go/short-var-decl`(1부)의 것이다 — 재선언·가리기는
; 스코프 규칙이지 값이 아니다 (`go.md` §0.5).
((var_declaration
   "var" @pick.1 @hole
   (var_spec name: (identifier) @pick.2 type: (_) @pick.3 !value)) @site
 (#set! form "zero"))

((assignment_statement
   left: (expression_list . (identifier) @pick.2 .)
   operator: "=" @pick.1 @hole
   right: (expression_list . (_) @pick.3 .)) @site
 (#set! form "assign"))
