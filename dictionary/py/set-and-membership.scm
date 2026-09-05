; 「들어 있나」를 묻는 낱말이 파이썬에는 하나다 — `in`. 리스트에 물으면 처음부터 훑고
; 집합·사전에 물으면 안 훑는다. 같은 글자가 자료 구조에 따라 값이 다른 일을 한다.
;
; `comparison.scm` 이 연산자 목록에서 `in`·`not in` 을 빼 둔 자리를 이 개념이 받는다
; (`is-identity` 가 `is`·`is not` 을 받은 것과 같은 나눔이다).
;
; `for x in xs` 의 `in` 은 `for_statement` 의 토큰이라 여기 안 잡힌다 — 노드가 다르다.

; `key in d` — 앵커 `.` 로 「자식이 정확히 셋」만 잡아 연쇄 비교를 잘라 냈다.
((comparison_operator
   . (_) @pick.2
   . "in" @pick.1 @hole
   . (_) @pick.3 .) @site
 (#set! form "member"))

; `key not in d` — 문법이 두 낱말을 **한 토큰**으로 담는다. `not` 만 따로 짚을 수 없다.
((comparison_operator
   . (_) @pick.2
   . "not in" @pick.1 @hole
   . (_) @pick.3 .) @site
 (#set! form "not-member"))

; `{"a", "b"}` — 콜론이 없는 중괄호는 집합이다. 중복이 사라지고 순서가 없다.
((set
   . "{" @pick.1
   . (_) @pick.2) @site
 (#set! form "set"))
