; 함수 만들기. Swift 의 요점은 **인자마다 부르는 이름과 받는 이름이 따로**라는 것이다 —
; `func greet(to name: String)` 를 `greet(to: "곽")` 로 부른다. 부르는 이름이 없는 함수도
; 사용처이므로 그 자리는 `?` 로 열어 둔다.
((function_declaration
   "func" @pick.1 @hole
   name: (simple_identifier) @pick.2
   (parameter external_name: (simple_identifier) @pick.3)?) @site
 (#set! form "func"))
