; 복사해서 벗어나기. AI 가 빌림 오류를 지우려고 가장 자주 넣는 한 줄(ai-pm 1,150곳).
; 왜 통하는지(값이 둘이 된다) 모르면 왜 느린지도, 왜 두 값이 갈라졌는지도 모른다.
; 구멍은 `clone` 이고 `to_owned`·`to_vec` 은 짚기만 한다.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "clone")
 (#set! form "clone"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "to_owned" "to_vec" "cloned")
 (#set! form "clone-alias"))
