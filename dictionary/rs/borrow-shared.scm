; 잠깐 빌려 읽기. `&` 는 주소를 얻는 게 아니라 **읽을 권한을 잠시 빌리는** 것이다.
; `&mut` 는 `rs/borrow-mut` 이 가져간다 — `not-match?` 로 뺀다.
; 빈칸은 안 낸다 — `&` 가 한 글자라 생성기가 뺀다(`MIN_HOLE`). yaml 의 `no_hole_reason`.

; 인자 자리의 `&x` — 함수에 읽기만 빌려 준다. 실측에서 가장 두꺼운 자리다 (6,753곳).
((call_expression
   function: (_) @pick.3
   arguments: (arguments (reference_expression "&" @pick.1 value: (_) @pick.2) @ctx.arg)) @site
 (#not-match? @ctx.arg "^&\\s*mut\\b")
 (#set! form "borrow-arg"))

; `let r = &x;` — 빌린 것에 이름을 붙인다. `r` 이 사는 동안 `x` 는 못 옮긴다(E0505).
((let_declaration
   "let" @pick.3
   pattern: (identifier) @pick.2
   value: (reference_expression "&" @pick.1 value: (_)) @ctx.arg) @site
 (#not-match? @ctx.arg "^&\\s*mut\\b")
 (#set! form "borrow-let"))

; `fn f(s: &String)` — 서명에 적힌 빌림. `&` 없는 인자를 찾는 게 더 어렵다.
((parameter
   pattern: (identifier) @pick.2
   type: (reference_type "&" @pick.1 type: (_) @pick.3) @ctx.arg) @site
 (#not-match? @ctx.arg "^&\\s*mut\\b")
 (#set! form "borrow-param"))

; `&self` — 자기 자신을 읽기만 빌리는 메서드.
((self_parameter
   "&" @pick.1
   (self) @pick.2) @site @ctx.arg
 (#not-match? @ctx.arg "mut")
 (#set! form "borrow-self"))
