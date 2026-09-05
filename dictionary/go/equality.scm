; 같은 값인가. **양쪽 어디에도 `nil` 이 없는 견주기만** 잡는다.
;
; 좁힌 이유가 수치다 — `cli/cli` 의 `if` 7,669개 중 2,284개(30%)가 `if err != nil` 이라
; (`go.md` §1), 좁히지 않으면 `go/equality`·`go/if-statement`·`go/nil`·`go/error-check`
; 넷의 첫 노출이 전부 같은 세 줄이 된다 (`README.md` §7 ②). nil 견주기는
; `go/error-check` 와 `go/nil` 이 나눠 가진다.
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#not-eq? @pick.2 "nil")
 (#not-eq? @pick.3 "nil")
 (#set! form "eq"))
