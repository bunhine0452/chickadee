; 조건으로 흐름 나누기. Swift 는 **조건의 괄호가 없고 몸통의 중괄호는 한 줄이어도 있어야 한다.**
; `if let` 은 다른 개념(`swift/if-let`)이라 조건 종류를 열거해 갈라 둔다.
((if_statement
   "if" @pick.1 @hole
   condition: [(comparison_expression) (equality_expression) (conjunction_expression)
               (disjunction_expression) (boolean_literal) (prefix_expression)] @pick.2
   (statements) @pick.3) @site
 (#set! form "if"))
