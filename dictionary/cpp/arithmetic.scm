; 셈하기. 나누기와 나머지만 잡는다 — 더하기·곱하기는 언어마다 같고, C++ 이 파이썬과
; 갈리는 자리는 **양쪽이 정수면 결과도 정수**라는 나누기 하나다 (`cpp.md` §9 #8).
((binary_expression
   left: (_) @pick.2
   operator: ["/" "%"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "divide"))
