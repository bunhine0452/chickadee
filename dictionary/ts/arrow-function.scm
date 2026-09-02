; `(n) => n * 2` — 함수를 값처럼 쓰는 표기.
; 매개변수 안쪽으로 내려가지 않는다 — TS 는 `required_parameter`, JS 는 `identifier` 라
; 안쪽까지 적으면 문법별로 파일을 나눠야 한다 (03 §3.2).
((arrow_function
   parameters: (formal_parameters) @pick.1
   "=>" @pick.2
   body: (_) @pick.3) @site
 (#set! form "parens"))

; 매개변수가 하나면 괄호를 생략할 수 있다 — `u => u.name`.
((arrow_function
   parameter: (identifier) @pick.1
   "=>" @pick.2
   body: (_) @pick.3) @site
 (#set! form "bare"))
