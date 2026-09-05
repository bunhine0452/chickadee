; 글자 안에 값 끼워 넣기. Swift 에서 글자에 값을 넣는 사실상 유일한 표기다 — `+` 로 잇는 코드는
; 표본에서 거의 안 나온다. `\(` 와 `)` 는 문자열 노드의 **형제**이지 보간 노드 안이 아니다.
((line_string_literal
   (line_str_text) @pick.3
   "\\(" @pick.1 @hole
   interpolation: (interpolated_expression value: (_) @pick.2)) @site
 (#set! form "interp"))
