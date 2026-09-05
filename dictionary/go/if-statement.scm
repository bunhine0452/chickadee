; 조건으로 흐름 나누기. **조건에 `nil` 이 든 것은 뺀다** — 그것이 `go/error-check` 의
; 자리이고, 안 빼면 `cli/cli` 의 `if` 7,669개 중 2,284개가 여기로도 들어와 두 개념의 첫
; 노출이 같은 줄이 된다 (`README.md` §7 ②).
((if_statement
   "if" @pick.1 @hole
   !initializer
   condition: (_) @pick.2
   consequence: (block) @pick.3) @site
 (#not-match? @pick.2 "nil")
 (#set! form "if"))

((if_statement
   "if" @pick.1 @hole
   initializer: (_) @pick.4
   condition: (_) @pick.2
   consequence: (block) @pick.3) @site
 (#not-match? @pick.2 "nil")
 (#set! form "ifinit"))
