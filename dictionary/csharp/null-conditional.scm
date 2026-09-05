; 없을 수 있는 값 건너뛰기. 앞이 `null` 이면 뒤를 **안 보고** 그 자리의 값이 `null` 이 된다.
; 값 타입 멤버에 붙이면 결과 타입이 한 겹 바뀐다 — `int` 가 아니라 `int?` 다.
;
; 빈칸은 안 낸다 — 구멍이 물음표 한 글자라 생성에서 떨어진다(`MIN_HOLE`).
((conditional_access_expression
   condition: (_) @pick.2
   "?" @pick.1
   (member_binding_expression name: (identifier) @pick.3)) @site
 (#set! form "member"))
