; 조건 자리. 자바는 이 자리에 참·거짓 말고는 아무것도 못 받는다 — 그것이 이 개념이다.
((if_statement
   condition: (parenthesized_expression (_) @pick.1)) @site
 (#set! form "ifcond"))

((while_statement
   condition: (parenthesized_expression (_) @pick.1)) @site
 (#set! form "whilecond"))
