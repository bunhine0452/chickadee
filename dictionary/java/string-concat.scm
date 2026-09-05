; 잇기. 같은 `+` 인데 한쪽이 글자 묶음이면 더하기가 아니라 잇기가 된다.
; 왼쪽부터 접히므로 어느 쪽에 묶음이 있느냐가 결과를 바꾼다.
((binary_expression
   left: (string_literal) @pick.2
   operator: "+" @pick.1
   right: (_) @pick.3) @site
 (#set! form "concat-left"))

((binary_expression
   left: (_) @pick.2
   operator: "+" @pick.1
   right: (string_literal) @pick.3) @site
 (#set! form "concat-right"))
