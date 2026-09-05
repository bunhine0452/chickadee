; 0 이 아니면 참. 참·거짓 타입이 없어 조건 자리는 「0 이냐」만 본다 — `if (p)`·`if (!n)`·`while (*s)`.
; 견주기가 든 조건은 `c/comparison` 의 것이라 여기 안 든다. 짚는 것은 견주기 없이 조건이 된 값이다.
((if_statement
   "if" @pick.3
   condition: (parenthesized_expression
     [(identifier) (call_expression) (pointer_expression) (field_expression)
      (subscript_expression) (update_expression) (number_literal)] @pick.2)
   consequence: (_) @pick.1) @site
 (#set! form "if-bare"))

((if_statement
   "if" @pick.3
   condition: (parenthesized_expression
     (unary_expression operator: "!" @pick.1 argument: (_) @pick.2))) @site
 (#set! form "if-not"))

((while_statement
   "while" @pick.3
   condition: (parenthesized_expression
     [(identifier) (call_expression) (pointer_expression) (field_expression)
      (subscript_expression) (update_expression) (number_literal)] @pick.2)
   body: (_) @pick.1) @site
 (#set! form "while-bare"))

((while_statement
   "while" @pick.3
   condition: (parenthesized_expression
     (unary_expression operator: "!" @pick.1 argument: (_) @pick.2))) @site
 (#set! form "while-not"))
