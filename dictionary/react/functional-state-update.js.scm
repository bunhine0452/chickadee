; JS 판 — 괄호 매개변수가 `required_parameter` 없이 바로 `identifier` 다. 나머지는 TS 판과 같다.
((call_expression
   function: (identifier) @ctx.setter
   arguments: (arguments . (arrow_function
     parameters: (formal_parameters (identifier) @pick.1)
     body: (_) @pick.2))) @site
 (#match? @ctx.setter "^set[A-Z]")
 (#set! form "paren"))

((call_expression
   function: (identifier) @ctx.setter
   arguments: (arguments . (arrow_function
     parameter: (identifier) @pick.1
     body: (_) @pick.2))) @site
 (#match? @ctx.setter "^set[A-Z]")
 (#set! form "bare"))
