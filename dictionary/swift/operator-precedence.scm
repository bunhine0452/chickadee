; 괄호 없이 적은 식이 접히는 순서. Swift 는 우선순위를 언어가 아니라 표준 라이브러리의
; `precedencegroup` 선언에 뒀고, 그래서 `<<` 가 `+` **위**에 있다 — C·자바·C# 과 반대다.
((additive_expression
   lhs: (_) @pick.2
   op: ["+" "-"] @pick.1 @hole
   rhs: (multiplicative_expression) @pick.3) @site
 (#set! form "mixed"))

((bitwise_operation
   lhs: (_) @pick.2
   op: ["<<" ">>"] @pick.1 @hole
   rhs: (_) @pick.3) @site
 (#set! form "shift"))

((conjunction_expression
   lhs: (_) @pick.2
   op: "&&" @pick.1 @hole
   rhs: (_) @pick.3) @site
 (#set! form "shortcircuit"))

((disjunction_expression
   lhs: (_) @pick.2
   op: "||" @pick.1 @hole
   rhs: (conjunction_expression) @pick.3) @site
 (#set! form "mixed-logic"))
