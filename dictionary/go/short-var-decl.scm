; 이름 만들며 값 넣기. **왼쪽 이름이 정확히 하나인 것만** 잡는다 — `v, err := f()` 는
; 이름이 둘이라 `parameter_declaration` 과 같은 「묶인 노드」 문제가 생기고(`go.md` §8 ②),
; 그 자리는 `go/return-multi`·`go/error-check` 가 받는다.
((short_var_declaration
   left: (expression_list . (identifier) @pick.2 .)
   ":=" @pick.1 @hole
   right: (expression_list . (_) @pick.3 .)) @site
 (#set! form "short"))
