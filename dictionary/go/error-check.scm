; 실패를 값으로 받아 확인하기 — **Go 에서 가장 흔한 세 줄**이다.
; `cli/cli` 429파일에서 `if err != nil` 이 2,284곳 · 316파일(74%)이다 (`go.md` §1).
;
; 이 개념이 그 줄을 **전담한다**. `go/if-statement`·`go/equality` 는 조건에 `nil` 이 든 것을
; 빼고, `go/nil` 은 견주기를 뺀다 — 넷의 첫 노출이 같은 세 줄이 되는 것을 그렇게 막았다
; (`README.md` §7 ②).
((if_statement
   "if" @pick.4
   condition: (binary_expression
     left: (identifier) @pick.2
     operator: "!=" @pick.1 @hole
     right: (nil) @pick.3)
   consequence: (block) @pick.5) @site
 (#match? @pick.2 "[eE]rr")
 (#set! form "check"))
