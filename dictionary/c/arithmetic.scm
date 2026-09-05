; 셈하기. 나누기를 따로 낸다 — 양쪽이 정수면 나누기도 정수라는 것이 C 의 요점이고(`7/2` 는 3),
; 그것은 구문이 아니라 피연산자의 타입이라 여기서는 못 가른다(c.md §8 ⑥). 판의 글이 그 일을 한다.
; 문 자리의 `a * b;` 는 선언으로 파싱된다(§8 ①) — 식 안의 `*` 만 잡힌다.
((binary_expression
   left: (_) @pick.2
   operator: ["+" "-" "*" "%"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "arith"))

((binary_expression
   left: (_) @pick.2
   operator: "/" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "div"))
