; 고칠 수 있게 빌리기. 같은 값에 `&mut` 는 하나뿐이고 `&` 와 겹치지도 않는다 — E0499·E0502 의
; 자리이고, 그 규칙의 존재 이유가 `cs/aliasing` 한 장이다. 구멍은 `mut` 이다.
((reference_expression
   "&" @pick.3
   (mutable_specifier) @pick.1 @hole
   value: (_) @pick.2) @site
 (#set! form "borrow-mut"))

((parameter
   pattern: (identifier) @pick.2
   type: (reference_type "&" @pick.3 (mutable_specifier) @pick.1 @hole type: (_))) @site
 (#set! form "borrow-mut-param"))

((self_parameter
   "&" @pick.3
   (mutable_specifier) @pick.1 @hole
   (self) @pick.2) @site
 (#set! form "mut-self"))
