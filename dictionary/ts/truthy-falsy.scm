; 거짓이 되는 값이 여섯이고(`false 0 '' null undefined NaN`) `[]`·`{}` 는 참이다.
; 그 규칙이 실제로 도는 자리는 **견주기 없이 값을 그대로 조건에 둔 곳**이다.
((if_statement
   "if" @pick.3
   condition: (parenthesized_expression [(identifier) (member_expression)] @pick.1)
   consequence: (_) @pick.2) @site
 (#set! form "bare-if"))

; `!value` — 값을 참·거짓으로 뒤집는다. 여섯 중 하나면 참이 된다.
((unary_expression
   operator: "!" @pick.2
   argument: [(identifier) (member_expression)] @pick.1) @site
 (#set! form "negate"))
