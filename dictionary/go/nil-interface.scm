; 비었는데 비지 않은 것. 인터페이스가 (타입, 값) 둘이라는 사실은 **타입 정보**라 문법에
; 안 보인다(`go.md` §10 「확인 못 함」 ③). 그래서 잡는 것은 그 사고가 **일어날 수 있는
; 자리** — 값이 인터페이스 타입(`error`)으로 들어가는 칸 둘이다.
;
; 구조체 칸은 뺐다. 대문자로 시작하는 `Err error` 가 `go/package-visibility` 의 자리와
; 겹친다.
((function_declaration
   name: (identifier) @pick.3
   result: (type_identifier) @pick.1
   body: (block)) @site
 (#eq? @pick.1 "error")
 (#set! form "result"))

((parameter_declaration
   name: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole) @site
 (#eq? @pick.1 "error")
 (#set! form "param"))
