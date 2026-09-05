; 바꿀 수 있다고 적기. 구멍은 `mut` 이고 **이름에 붙는 표시**라는 것이 요점이다 —
; `&mut x` 의 `mut` 은 같은 노드 이름(`mutable_specifier`)인데 부모가 `reference_expression`
; 이라 여기 안 걸린다 (rs.md §8 ⑤). 그쪽은 `rs/borrow-mut` 다.
((let_declaration
   "let" @pick.3
   (mutable_specifier) @pick.1 @hole
   pattern: (identifier) @pick.2) @site
 (#set! form "let-mut"))

; 파라미터에 붙은 `mut` — `fn f(mut v: Vec<i32>)`. 받은 값을 함수 안에서 고치겠다는 표시.
((parameter
   (mutable_specifier) @pick.1 @hole
   pattern: (identifier) @pick.2
   type: (_) @pick.3) @site
 (#set! form "mut-param"))
