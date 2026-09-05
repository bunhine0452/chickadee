; 자리가 모자라면. 넘침 **그 자체**는 구문에 안 남는다 — `a + b` 의 트리는 넘치든 아니든 같다.
; 코드에 남는 것은 뜻을 적은 메서드 이름 넷과 한계값 상수뿐이다 (rs.md §0.7).
;
; 구멍의 정본은 `checked_add` 다 — 「모자라면 None」이 넷 중 초보가 먼저 배울 뜻이다.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#match? @pick.1 "^(wrapping|checked|saturating|overflowing)_(add|sub|mul|div|rem|neg|pow|shl|shr|abs)$")
 (#set! form "overflow-method"))

; `u8::MAX` · `i32::MIN` — 칸 수가 정해져 있다는 사실을 이름으로 부르는 자리.
((scoped_identifier
   path: (identifier) @pick.2
   "::" @pick.3
   name: (identifier) @pick.1) @site
 (#match? @pick.2 "^[iu](8|16|32|64|128|size)$")
 (#any-of? @pick.1 "MAX" "MIN")
 (#set! form "limit"))
