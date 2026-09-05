; 조건으로 골라내기. `List` 의 메서드가 아니라 **확장 메서드**라, `using System.Linq;` 가
; 없으면 같은 코드가 컴파일되지 않는다.
((invocation_expression
   function: (member_access_expression
     expression: (_) @pick.2
     name: (identifier) @pick.1 @hole)
   arguments: (argument_list (argument (_) @pick.3))) @site
 (#eq? @pick.1 "Where")
 (#set! form "where"))
