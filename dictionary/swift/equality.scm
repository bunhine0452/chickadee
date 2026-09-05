; 견주는 자리. Swift 에서 「같은 값인가」와 「같은 상자인가」는 **낱말이 다르다** — `==` 와 `===`.
((equality_expression
   lhs: (_) @pick.2
   op: ["==" "!=" "===" "!=="] @pick.1 @hole
   rhs: (_) @pick.3) @site
 (#set! form "equal"))

; `!=`·`!==` 는 tree-sitter-swift 0.7.3 이 `equality_expression` 이 아니라 `infix_expression` +
; `custom_operator` 로 읽는다(2026-09-06 골든 — `(n != 0)` 이 0곳이었다).
((infix_expression
   lhs: (_) @pick.2
   op: (custom_operator) @pick.1 @hole
   rhs: (_) @pick.3) @site
 (#any-of? @pick.1 "!=" "!==")
 (#set! form "equal"))
