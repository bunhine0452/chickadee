; 하나씩 훑기. `for x in v` 는 **`v` 를 먹는다** — `&v` 나 `v.iter()` 를 안 쓰면 반복 뒤 `v` 가
; 사라져 있다. 초심자의 첫 E0382 가 대개 여기다. 무엇을 훑는지(`value`)가 그래서 셋째 자리다.
((for_expression
   "for" @pick.1 @hole
   pattern: (_) @pick.2
   value: (_) @pick.3
   body: (block) @pick.4) @site
 (#set! form "for"))
