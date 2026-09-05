; 타입 좁히기 — `if` 한 줄이 아래에서 할 수 있는 일을 바꾼다.
; 문법이 [typescript, tsx] 뿐인 것은 좁혀지는 대상이 타입이기 때문이다. 같은 글자가 `.js`
; 파일에서도 돌지만 거기서는 값을 가를 뿐이라 `ts/typeof-guard` 가 따로 받는다.
((if_statement
   condition: (parenthesized_expression
     (binary_expression
       left: (unary_expression operator: "typeof" argument: (_) @pick.2) @pick.1
       right: (string) @pick.3))) @site
 (#set! form "typeof"))

((if_statement
   "if" @pick.1
   condition: (parenthesized_expression
     (binary_expression left: (_) @pick.3 operator: "in" right: (_) @pick.2))) @site
 (#set! form "in"))

((if_statement
   "if" @pick.1
   condition: (parenthesized_expression
     (binary_expression left: (_) @pick.2 operator: "instanceof" right: (_) @pick.3))) @site
 (#set! form "instanceof"))
