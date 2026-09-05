; `==` 는 값을 견주고 `is` 는 **같은 자리**냐를 묻는다. 파이썬 데이터 모델 3.1 이
; "The `is` operator compares the identity of two objects" 로 정의로 적어 둔 자리다.
;
; `comparison.scm` 이 연산자 목록에서 `is`·`is not`·`in`·`not in` 을 빼 둔 이유가 여기다 —
; 그쪽 주석은 연쇄 비교만 적고 있고, 이 개념이 그 나머지 절반을 받는다.
;
; 사용자 리포 둘에서 `is` 리터럴(`x is 1000` 류)은 **0곳**이다. 파이썬 3.8 이
; `SyntaxWarning: "is" with a literal` 을 낸 뒤로 그 습관이 실제로 사라졌다는 뜻이고,
; 그래서 이 개념의 **틀리는 자리는 합성이 정본**이다 (`py-learning.md` §11.5 ②).

; `x is None` · `x is True` — 자리를 견준다. 앵커 `.` 로 「자식이 정확히 셋」만 잡아
; 연쇄 비교(`a is b is c`)를 잘라 냈다 — `comparison.scm` 이 쓴 것과 같은 규칙이다.
((comparison_operator
   . (_) @pick.2
   . "is" @pick.1 @hole
   . (_) @pick.3 .) @site
 (#set! form "is"))

; `x is not None` — 문법이 두 낱말을 **한 토큰**으로 담는다(`is not`). `not` 만 따로 짚을 수
; 없고, 그래서 이 개념의 구멍은 늘 낱말 통째다.
((comparison_operator
   . (_) @pick.2
   . "is not" @pick.1 @hole
   . (_) @pick.3 .) @site
 (#set! form "is-not"))
