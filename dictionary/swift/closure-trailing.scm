; 마지막 인자를 괄호 밖에. 함수 인자가 괄호 밖 중괄호로 나오는 표기이고, SwiftUI 코드가
; 함수 호출처럼 안 보이는 첫째 원인이다. `call_suffix` 는 인자·클로저·둘 다 셋 중 하나라
; `value_arguments` 를 요구하면 `VStack { }` 를 통째로 놓친다 (swift.md §8).
((call_expression
   (simple_identifier) @pick.2
   (call_suffix (lambda_literal (statements) @pick.3) @pick.1)) @site
 (#set! form "trailing"))

((call_expression
   (navigation_expression suffix: (navigation_suffix suffix: (simple_identifier) @pick.2))
   (call_suffix (lambda_literal (statements) @pick.3) @pick.1)) @site
 (#set! form "trailing-method"))
