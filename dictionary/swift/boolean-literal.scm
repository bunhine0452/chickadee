; 참·거짓 값. Swift 의 조건 자리에는 `Bool` 말고 아무것도 못 온다 — 「참 같은 값」이 없다.
((property_declaration
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (user_type (type_identifier) @pick.3 @hole))?
   value: (boolean_literal) @pick.1) @site
 (#set! form "boollit"))

; 조건 자리. `if let` 은 여기 안 든다 — `condition:` 이 되풀이 필드라 묶음 종류를 열거해 가른다
; (열거 안 하면 `if let x = u` 의 `u` 가 조건으로 잡힌다).
((if_statement
   condition: [(comparison_expression) (equality_expression) (conjunction_expression)
               (disjunction_expression) (boolean_literal) (prefix_expression)] @pick.1) @site
 (#set! form "ifcond"))

((while_statement
   condition: [(comparison_expression) (equality_expression) (conjunction_expression)
               (disjunction_expression) (boolean_literal) (prefix_expression)] @pick.1) @site
 (#set! form "whilecond"))
