; 두 값 견주기. 구멍은 견주는 기호이고, `=`(넣기)와 `==`(묻기)의 갈림이 요점이다.
; `<`·`>` 는 숫자에만 쓸 수 있다는 것도 같은 개념이 진다.
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
