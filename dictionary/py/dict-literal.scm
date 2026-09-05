; 같은 중괄호가 **비면 사전, 값만 있으면 집합**이다. `{}` 가 빈 집합이라고 믿는 것이
; `py.md` §9 #14 이고, 빈 집합은 `set()` 이라 문법이 아니라 함수다.
;
; 키는 넣은 순서를 지킨다(3.7+). 그 사실이 없던 시절에 나온 「사전은 순서가 없다」가
; 아직 돌아다니고, 그것이 이 개념의 `bridge` 가 받는 자리다.
;
; 컴프리헨션(`{k: v for …}`)은 노드가 `dictionary_comprehension` 이라 여기 안 잡힌다 —
; `py/list-comprehension` 의 자리다.

; `{"name": v, …}` — 콜론 하나가 키와 값을 잇는다.
((dictionary
   . "{" @pick.1 @hole
   . (pair
       key: (_) @pick.2
       ":" @pick.3
       value: (_))) @site
 (#set! form "pairs"))

; `{}` — **빈 사전**이다. 빈 집합이 아니다.
((dictionary
   . "{" @pick.1 @hole
   . "}" @pick.2) @site
 (#set! form "empty"))
