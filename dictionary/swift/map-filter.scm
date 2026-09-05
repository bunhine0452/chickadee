; 항목마다 바꿔 새로 만들기. Swift 에서 이 이름들은 **배열에도 옵셔널에도** 있다 —
; `[1,2].map{}` 와 `name?.map{}` 이 같은 이름인데 하나는 목록을, 하나는 값 하나를 훑는다.
((call_expression
   (navigation_expression
     target: (_) @pick.2
     suffix: (navigation_suffix suffix: (simple_identifier) @pick.1 @hole))
   (call_suffix (lambda_literal (statements) @pick.3))) @site
 (#any-of? @pick.1 "map" "filter" "compactMap" "flatMap" "reduce" "forEach")
 (#set! form "hof"))
