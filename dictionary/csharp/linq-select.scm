; 항목마다 바꿔 새로 만들기. 결과가 `List` 가 아니라 `IEnumerable<T>` 라 `Count` 도
; 인덱서도 없다 — `ToList()` 를 붙여야 목록이 된다.
((invocation_expression
   function: (member_access_expression
     expression: (_) @pick.2
     name: (identifier) @pick.1 @hole)
   arguments: (argument_list (argument (_) @pick.3))) @site
 (#eq? @pick.1 "Select")
 (#set! form "select"))
