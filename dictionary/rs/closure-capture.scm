; 클로저가 무엇을 데려가나. 캡처를 `&`·`&mut`·값 중 무엇으로 할지 **컴파일러가 정한다** —
; `move` 가 그 결정을 값 쪽으로 강제한다. 구멍은 `move`.
((closure_expression
   "move" @pick.1 @hole
   parameters: (closure_parameters) @pick.2
   body: (_) @pick.3) @site
 (#set! form "move-closure"))

; 어댑터에 넘긴 클로저 — `.map(|x| x * 2)`. 클로저 사용처의 대다수가 이 모양이다.
((call_expression
   function: (field_expression field: (field_identifier) @pick.3)
   arguments: (arguments
     (closure_expression
       parameters: (closure_parameters) @pick.1
       body: (_) @pick.2) @ctx.whole)) @site
 (#not-match? @ctx.whole "^move\\b")
 (#set! form "closure-arg"))

; 이름을 붙인 클로저 — `let f = |x| x + 1;`.
((let_declaration
   "let" @pick.3
   pattern: (identifier)
   value: (closure_expression
     parameters: (closure_parameters) @pick.1
     body: (_) @pick.2) @ctx.whole) @site
 (#not-match? @ctx.whole "^move\\b")
 (#set! form "closure-let"))
