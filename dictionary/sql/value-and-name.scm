; 따옴표가 값과 이름을 가른다. 작은따옴표가 붙은 쪽만 값이다 —
; `#match?` 는 **원문**을 본다(자리표는 파서에게만 가려진다, `params.rs`)이므로
; `#{x}` · `:x` 는 여기 안 걸린다. 따옴표 이야기가 아니기 때문이다.
((binary_expression
   left: (field (identifier) @pick.2)
   operator: "=" @pick.3
   right: (literal) @pick.1) @site
 (#match? @pick.1 "^'")
 (#set! form "text-value"))
