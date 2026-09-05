; 괄호 안에 또 다른 조회. 괄호와 안쪽의 고르는 낱말을 같이 잡아
; 「이 괄호가 값 하나냐 표 하나냐」를 물을 수 있게 한다.
((subquery
   "(" @pick.4
   (select (keyword_select) @pick.1 @hole (select_expression) @pick.2)
   (from (relation (object_reference (identifier) @pick.3)))) @site
 (#set! form "subquery"))
