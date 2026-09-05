; 값이 된 메서드. `->` 왼쪽이 받는 것, 오른쪽이 하는 일이다.
;
; 람다는 **메서드가 하나뿐인 인터페이스**의 짧은 표기라 받는 자리마다 타입 이름이 다르다.
; 같은 것을 더 짧게 적는 `::` 표기도 같은 개념으로 잡는다.
((lambda_expression
   parameters: (_) @pick.2
   "->" @pick.1 @hole
   body: (_) @pick.3) @site
 (#set! form "lambda"))

((method_reference
   "::" @pick.4) @site
 (#set! form "method-ref"))
