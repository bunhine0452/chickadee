; 줄줄이 이어 훑기. `.stream()` 이 열고, 끝내는 연산이 붙어야 그때 한 번에 흐른다.
;
; 이름으로 가른다 — 노드는 여느 메서드 호출과 같다. `#match?` 를 안 쓰고 `#eq?` 두 벌로
; 적은 것은 추정으로 잡힌 사용처가 의미형 문항에서 빠지기 때문이다(04 §1.2).
((method_invocation
   object: (_) @pick.2
   name: (identifier) @pick.1 @hole
   arguments: (argument_list) @pick.3) @site
 (#eq? @pick.1 "stream")
 (#set! form "open"))

((method_invocation
   object: (method_invocation) @pick.4
   name: (identifier) @pick.1
   arguments: (argument_list) @pick.5) @site
 (#eq? @pick.1 "collect")
 (#set! form "collect"))
