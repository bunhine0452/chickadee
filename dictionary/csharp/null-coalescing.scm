; 없을 때 채우기. **`null` 만 걸린다** — 빈 문자열과 `0` 은 그대로 통과한다.
; 되넣는 꼴(`??=`)은 같은 기계라 한 개념이 진다.
((binary_expression
   left: (_) @pick.2
   operator: "??" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "coalesce"))

((assignment_expression
   left: (_) @pick.2
   operator: "??=" @pick.1
   right: (_) @pick.3) @site
 (#set! form "coalesce-assign"))
