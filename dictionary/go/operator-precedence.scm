; 괄호를 안 쓰면 무엇이 먼저 묶이나. **한쪽 피연산자가 또 이항식인 자리**만 잡는다 —
; 거기서만 「무엇이 먼저인가」를 물을 수 있다.
;
; 논리 연산자(`&&`·`||`)는 뺐다. Go 의 다섯 단 중 그 둘은 맨 아래 두 단이라 섞일 일이
; 없고, 넣으면 `if a && b != nil` 류가 통째로 들어와 `go/error-check` 와 겹친다.
((binary_expression
   left: (binary_expression) @pick.2
   operator: _ @pick.1 @hole
   right: (_) @pick.3) @site
 (#any-of? @pick.1 "+" "-" "*" "/" "%" "<<" ">>" "&" "|" "^" "&^")
 (#set! form "left"))

((binary_expression
   left: (_) @pick.2
   operator: _ @pick.1 @hole
   right: (binary_expression) @pick.3) @site
 (#any-of? @pick.1 "+" "-" "*" "/" "%" "<<" ">>" "&" "|" "^" "&^")
 (#set! form "right"))
