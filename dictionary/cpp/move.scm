; 옮겨도 된다고 표시하기. 요점은 **아무것도 옮기지 않는다**는 것이다 — 표를 붙일 뿐이고
; 실제 옮기는 일은 받는 쪽 생성자나 대입이 한다 (`cpp.md` §9 #1).
((call_expression
   function: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (identifier) @pick.1 @hole)
   arguments: (argument_list (_) @pick.3)) @site
 (#any-of? @pick.1 "move" "forward")
 (#set! form "move"))
