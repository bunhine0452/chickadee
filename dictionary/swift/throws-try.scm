; 터질 수 있다고 표시하기. 부르는 줄마다 `try` 를 적어야 해서 **어디서 터질 수 있는지가
; 호출 줄에 남는다.** `try`·`try?`·`try!` 는 트리에서 하나라 잡은 글자를 봐야 갈린다
; (swift.md §8 함정 ④).
((try_expression
   (try_operator) @pick.1 @hole
   expr: (_) @pick.2) @site
 (#set! form "try"))

((function_declaration
   name: (simple_identifier) @pick.2
   (throws) @pick.1 @hole
   body: (function_body (statements) @pick.3)) @site
 (#set! form "throws"))
