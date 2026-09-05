; 견주기 — 파이썬의 `comparison_operator` 는 `a < b < c` 연쇄를 한 노드로 담고
; `left`/`right` 필드가 없다(자식이 여럿, `operators` 도 여럿). 앵커 `.` 로 「자식이
; 정확히 둘」인 것만 잡는다 — 연쇄는 바닥 개념의 사용처가 아니다.
((comparison_operator
   . (_) @pick.2
   . ["==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   . (_) @pick.3 .) @site
 (#set! form "compare"))
