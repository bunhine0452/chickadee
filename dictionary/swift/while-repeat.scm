; 조건이 참인 동안 되풀이. 다른 언어의 `do-while` 이 Swift 에서는 `repeat-while` 이다 —
; `do` 는 오류를 받는 블록이라 이름을 뺏겼다.
((while_statement
   "while" @pick.1 @hole
   condition: [(comparison_expression) (equality_expression) (conjunction_expression)
               (disjunction_expression) (boolean_literal) (prefix_expression)] @pick.2
   (statements) @pick.3) @site
 (#set! form "while"))

((repeat_while_statement
   "repeat" @pick.1 @hole
   (statements) @pick.3
   condition: (_) @pick.2) @site
 (#set! form "repeat"))
