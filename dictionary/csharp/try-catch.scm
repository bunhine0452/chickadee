; 터진 것을 받아 잇기. C# 에는 검사 예외가 없어 **시그니처에 무엇이 터질지 안 적힌다** —
; `catch` 를 붙일 자리를 코드만 봐서는 못 찾는다.
;
; 잡을 것을 안 적는 꼴(`catch { }`)이 있으므로 선언은 선택이다.
((try_statement
   "try" @pick.1
   body: (block) @pick.2
   (catch_clause
     "catch" @pick.3 @hole
     (catch_declaration type: (_) @pick.4)?
     body: (block) @pick.5)) @site
 (#set! form "try"))
