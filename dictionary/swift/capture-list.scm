; 클로저가 붙잡는 것 정하기. 클로저는 바깥 이름을 붙잡아 두고, 그것이 `self` 면 화면이
; 사라져도 안 지워진다 — `[weak self]` 가 코드마다 붙어 있는 이유다.
((lambda_literal
   captures: (capture_list
     (capture_list_item (ownership_modifier) @pick.1 @hole name: (_) @pick.2))
   (statements) @pick.3) @site
 (#set! form "capture"))
