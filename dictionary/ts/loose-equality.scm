; `==` 는 타입이 다르면 한쪽을 바꿔 견준다. `===` 와 같은 `binary_expression` 이라
; 연산자 목록으로 갈라 놓는다 (`ts/comparison` 이 엄격한 쪽을 맡는다).
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "loose"))
