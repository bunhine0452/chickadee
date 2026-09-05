; 같은 것인가 같은 값인가. C# 에서 이 물음의 답은 **변수에 적힌 정적 타입**이 정한다 —
; `string` 은 내용, 보통의 `class` 는 같은 객체인지, `record` 는 다시 내용이다.
;
; 제네릭의 `<` 와 겹치지 않게 견주기 기호를 열거로 못박는다(`csharp.md` §8 ②).
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))

((invocation_expression
   function: (member_access_expression
     expression: (_) @pick.2
     name: (identifier) @pick.1)
   arguments: (argument_list (argument (_) @pick.3))) @site
 (#eq? @pick.1 "Equals")
 (#set! form "equals"))
