; 그 자리에서 만든 함수. 대괄호 안이 **무엇을 복사하고 무엇을 빌릴지** 적는 자리다 —
; 복사 절벽 그 자체다 (`cpp.md` §4 #24).
((lambda_expression
   captures: (lambda_capture_specifier) @pick.1 @hole
   declarator: (abstract_function_declarator parameters: (parameter_list) @pick.2)
   body: (compound_statement) @pick.3) @site
 (#set! form "lambda"))

((lambda_expression
   !declarator
   captures: (lambda_capture_specifier) @pick.1 @hole
   body: (compound_statement) @pick.3) @site
 (#set! form "lambda-bare"))
